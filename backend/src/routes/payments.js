import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";
import { uploadImage, publicUrlFor, UPLOADS_DIR } from "../lib/upload.js";
import { analyzeReceipt, computeReceiptHash } from "../services/receiptOcr.js";
import { logActivity, logAdminAction, notifyAllAdmins } from "../services/activity.js";
import { DEFAULT_PREMIUM_PLANS } from "../data/premiumPlans.js";
import path from "path";

export const paymentsRouter = Router();

function planPrice(planKey) {
  const plan = DEFAULT_PREMIUM_PLANS.find((p) => p.key === planKey);
  if (!plan) return null;
  return Number(String(plan.price).replace(/\D/g, ""));
}

function serializePayment(p) {
  return {
    id: p.id,
    planKey: p.planKey,
    planName: p.planName,
    amount: p.amount,
    originalAmount: p.originalAmount,
    discountPercent: p.discountPercent,
    receiptImageUrl: p.receiptImageUrl,
    status: p.status,
    ocr: {
      extractedText: p.ocrExtractedText,
      extractedAmount: p.ocrExtractedAmount,
      extractedCard: p.ocrExtractedCard,
      extractedDate: p.ocrExtractedDate,
      warnings: p.ocrWarnings ? JSON.parse(p.ocrWarnings) : [],
      confidence: p.ocrConfidence,
    },
    rejectionReason: p.rejectionReason,
    reviewedAt: p.reviewedAt,
    createdAt: p.createdAt,
  };
}

// ============================== FOYDALANUVCHI TOMONI ==============================

// GET /api/payments/card-info — admin karta ma'lumotlari (to'lov qilishdan oldin ko'rsatiladi)
paymentsRouter.get("/card-info", requireAuth, asyncHandler(async (_req, res) => {
  res.json({
    cardNumber: process.env.ADMIN_CARD_DISPLAY || process.env.ADMIN_CARD_NUMBERS?.split(",")[0] || "",
    cardOwner: process.env.ADMIN_CARD_OWNER || "",
  });
}));

// GET /api/payments/plan-price/:planKey — chegirma hisobga olingan yakuniy narx
paymentsRouter.get("/plan-price/:planKey", requireAuth, asyncHandler(async (req, res) => {
  const { planKey } = req.params;
  const base = planPrice(planKey);
  if (base == null) return res.status(404).json({ error: "Tarif topilmadi" });

  const discount = await prisma.discount.findUnique({ where: { userId: req.auth.sub } });
  const isExpired = discount?.expiresAt && discount.expiresAt < new Date();
  const percent = discount && !isExpired ? discount.percent : 0;
  const amount = Math.round(base * (1 - percent / 100));

  res.json({ planKey, originalAmount: base, discountPercent: percent, amount });
}));

// GET /api/payments/mine — o'z to'lovlari tarixi
paymentsRouter.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  const payments = await prisma.paymentRequest.findMany({
    where: { userId: req.auth.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json({ payments: payments.map(serializePayment) });
}));

// POST /api/payments/submit (multipart, field: "receipt")  { planKey }
// Chekni yuklab, OCR orqali tahlil qiladi va Pending holatda admin navbatiga qo'yadi.
// HECH QACHON o'zi Premium'ni faollashtirmaydi — bu faqat admin approve qilganda sodir bo'ladi.
paymentsRouter.post("/submit", requireAuth, uploadImage.single("receipt"), asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const { planKey } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Chek rasmi topilmadi" });
  }

  const plan = DEFAULT_PREMIUM_PLANS.find((p) => p.key === planKey);
  if (!plan) {
    return res.status(400).json({ error: "Noto'g'ri tarif" });
  }

  const filePath = path.join(UPLOADS_DIR, req.file.filename);

  // Dublikat himoyasi — bir xil chek qayta yuklanganini tekshirish
  const receiptHash = await computeReceiptHash(filePath);
  const duplicate = await prisma.paymentRequest.findFirst({ where: { receiptHash } });
  if (duplicate) {
    return res.status(409).json({ error: "duplicate_receipt", message: "Bu chek allaqachon ishlatilgan." });
  }

  const discount = await prisma.discount.findUnique({ where: { userId } });
  const isExpired = discount?.expiresAt && discount.expiresAt < new Date();
  const discountPercent = discount && !isExpired ? discount.percent : 0;
  const baseAmount = planPrice(planKey) ?? 0;
  const finalAmount = Math.round(baseAmount * (1 - discountPercent / 100));

  // OCR — faqat ma'lumot ajratish + ogohlantirish, tasdiqlash EMAS (services/receiptOcr.js ga qarang)
  const ocr = await analyzeReceipt(filePath, { expectedAmount: finalAmount });

  const payment = await prisma.paymentRequest.create({
    data: {
      userId,
      planKey,
      planName: plan.name,
      amount: finalAmount,
      originalAmount: baseAmount,
      discountPercent,
      receiptImageUrl: publicUrlFor(req.file.filename),
      receiptHash,
      status: "PENDING",
      ocrExtractedText: ocr.extractedText?.slice(0, 4000) || null,
      ocrExtractedAmount: ocr.extractedAmount,
      ocrExtractedCard: ocr.extractedCard,
      ocrExtractedDate: ocr.extractedDate,
      ocrWarnings: JSON.stringify(ocr.warnings),
      ocrConfidence: ocr.confidence,
    },
  });

  await logActivity(userId, "PAYMENT_SUBMITTED", `${plan.name} tarifi uchun chek yubordi`, { paymentId: payment.id });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyAllAdmins({
    type: "PAYMENT_REQUEST",
    title: "Yangi to'lov so'rovi",
    body: `${user?.name || "Foydalanuvchi"} — ${plan.name}`,
    linkType: "payment",
    linkId: payment.id,
  });

  res.status(201).json({ payment: serializePayment(payment) });
}));

// ============================== ADMIN TOMONI ==============================

const adminPayments = Router();
adminPayments.use(requireAuth, requireAdmin);

// GET /api/admin/payments?status=PENDING — eng kam ogohlantirishli (ochiq) cheklar tepada
adminPayments.get("/", asyncHandler(async (req, res) => {
  const { status } = req.query;
  const payments = await prisma.paymentRequest.findMany({
    where: { status: ["PENDING", "APPROVED", "REJECTED"].includes(status) ? status : undefined },
    orderBy: [{ status: "asc" }, { ocrConfidence: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { id: true, name: true, username: true, telegramId: true } } },
    take: 100,
  });

  res.json({
    payments: payments.map((p) => ({
      ...serializePayment(p),
      user: { ...p.user, telegramId: p.user.telegramId.toString() },
    })),
  });
}));

// POST /api/admin/payments/:id/approve
adminPayments.post("/:id/approve", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const payment = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!payment) return res.status(404).json({ error: "To'lov topilmadi" });
  if (payment.status !== "PENDING") return res.status(400).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30); // barcha tariflar 1 oylik — premiumData.js dagi period bilan mos

  await prisma.$transaction([
    prisma.paymentRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: req.auth.sub, reviewedAt: now },
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumPlan: payment.planKey,
        premiumStartedAt: now,
        premiumExpiresAt: expires,
      },
    }),
  ]);

  await logActivity(payment.userId, "PAYMENT_APPROVED", `${payment.planName} to'lovi tasdiqlandi`, { paymentId: id });
  await logActivity(payment.userId, "PREMIUM_GRANTED", `${payment.planName} tarifi faollashtirildi`);
  await logAdminAction(req.auth.sub, "PAYMENT_APPROVED", { targetUserId: payment.userId, details: payment.planName });

  res.json({ ok: true });
}));

// POST /api/admin/payments/:id/reject  { reason }
adminPayments.post("/:id/reject", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const payment = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!payment) return res.status(404).json({ error: "To'lov topilmadi" });
  if (payment.status !== "PENDING") return res.status(400).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });

  await prisma.paymentRequest.update({
    where: { id },
    data: { status: "REJECTED", rejectionReason: reason || null, reviewedById: req.auth.sub, reviewedAt: new Date() },
  });

  await logActivity(payment.userId, "PAYMENT_REJECTED", reason || "To'lov rad etildi", { paymentId: id });
  await logAdminAction(req.auth.sub, "PAYMENT_REJECTED", { targetUserId: payment.userId, details: reason || "" });

  res.json({ ok: true });
}));

export { adminPayments };
