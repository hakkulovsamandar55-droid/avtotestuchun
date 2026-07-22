import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser, requireAdminUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { uploadImage, publicUrlFor, UPLOADS_DIR } from "../lib/upload.js";
import { analyzeReceipt, computeReceiptHash } from "../services/receiptOcr.js";
import { logActivity, logAdminAction, notifyAllAdmins } from "../services/activity.js";
import { findPlan } from "../data/premiumPlans.js";
import { requireIdParam } from "../lib/validate.js";
import path from "path";
import fs from "fs/promises";

export const paymentsRouter = Router();

// Bitta xarid necha kun premium beradi. Ilgari bu qiymat approve
// handleri ichida "30" deb yozib qo'yilgan edi (magic number) —
// endi bitta joyda, nomi bilan.
const PREMIUM_DAYS_PER_PURCHASE = 30;

// Narx endi shared/data/premiumPlans.js da SON sifatida saqlanadi.
// Ilgari u "19 000" satri edi va har safar replace(/\D/g,"") bilan
// tozalanardi — bu formatlash o'zgarsa jimgina noto'g'ri narx berardi.
function planPrice(planKey) {
  return findPlan(planKey)?.price ?? null;
}

// Karta ma'lumotlari endi .env emas, DB orqali boshqariladi — admin panelda
// istalgan vaqt o'zgartiriladi, deploy shart emas. Birinchi so'rovda hali
// sozlanmagan bo'lsa, .env dagi eski qiymatlar (agar bo'lsa) boshlang'ich
// qiymat sifatida ishlatiladi — aks holda bo'sh qatorlar bilan yaratiladi.
async function getPaymentSettings() {
  let settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.paymentSettings.create({
      data: {
        id: 1,
        cardNumber: process.env.ADMIN_CARD_DISPLAY || process.env.ADMIN_CARD_NUMBERS?.split(",")[0] || "",
        cardOwner: process.env.ADMIN_CARD_OWNER || "",
      },
    });
  }
  return settings;
}

// Chek qabul qilinmasa (dublikat, ochiq so'rov mavjud, DB xatosi), yuklangan
// fayl diskda qolib ketmasligi kerak — vaqt o'tishi bilan bu yuzlab keraksiz
// rasm to'planishiga olib keladi.
async function removeUploadedFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("Yuklangan faylni o'chirib bo'lmadi:", err);
  }
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
paymentsRouter.get("/card-info", requireAuth, loadCurrentUser, asyncHandler(async (_req, res) => {
  const settings = await getPaymentSettings();
  res.json({ cardNumber: settings.cardNumber, cardOwner: settings.cardOwner });
}));

// GET /api/payments/plan-price/:planKey — chegirma hisobga olingan yakuniy narx
paymentsRouter.get("/plan-price/:planKey", requireAuth, loadCurrentUser, asyncHandler(async (req, res) => {
  const { planKey } = req.params;
  const base = planPrice(planKey);
  if (base == null) return res.status(404).json({ error: "Tarif topilmadi" });

  const discount = await prisma.discount.findUnique({ where: { userId: req.user.id } });
  const isExpired = discount?.expiresAt && discount.expiresAt < new Date();
  const percent = discount && !isExpired ? discount.percent : 0;
  const amount = Math.round(base * (1 - percent / 100));

  res.json({ planKey, originalAmount: base, discountPercent: percent, amount });
}));

// GET /api/payments/mine — o'z to'lovlari tarixi
paymentsRouter.get("/mine", requireAuth, loadCurrentUser, asyncHandler(async (req, res) => {
  const payments = await prisma.paymentRequest.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ payments: payments.map(serializePayment) });
}));

// POST /api/payments/submit (multipart, field: "receipt")  { planKey }
// Chekni yuklab, OCR orqali tahlil qiladi va Pending holatda admin navbatiga qo'yadi.
// HECH QACHON o'zi Premium'ni faollashtirmaydi — bu faqat admin approve qilganda sodir bo'ladi.
paymentsRouter.post("/submit", requireAuth, loadCurrentUser, uploadImage.single("receipt"), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { planKey } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "Chek rasmi topilmadi" });
  }

  const plan = findPlan(planKey);
  if (!plan) {
    return res.status(400).json({ error: "Noto'g'ri tarif" });
  }

  const filePath = path.join(UPLOADS_DIR, req.file.filename);

  // Ochiq (ko'rib chiqilmagan) so'rov bo'lsa, yangisini qabul qilmaymiz —
  // aks holda foydalanuvchi navbatni o'nlab bir xil so'rov bilan to'ldirib,
  // admin ishini qiyinlashtirishi mumkin edi.
  const pending = await prisma.paymentRequest.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (pending) {
    await removeUploadedFile(filePath);
    return res.status(409).json({
      error: "pending_exists",
      message: "Sizda ko'rib chiqilayotgan to'lov mavjud. Iltimos, javobni kuting.",
    });
  }

  // Dublikat himoyasi — bir xil chek qayta yuklanganini tekshirish
  const receiptHash = await computeReceiptHash(filePath);
  const duplicate = await prisma.paymentRequest.findFirst({ where: { receiptHash } });
  if (duplicate) {
    await removeUploadedFile(filePath);
    return res.status(409).json({ error: "duplicate_receipt", message: "Bu chek allaqachon ishlatilgan." });
  }

  const discount = await prisma.discount.findUnique({ where: { userId } });
  const isExpired = discount?.expiresAt && discount.expiresAt < new Date();
  const discountPercent = discount && !isExpired ? discount.percent : 0;
  const baseAmount = planPrice(planKey) ?? 0;
  const finalAmount = Math.round(baseAmount * (1 - discountPercent / 100));

  const paymentSettings = await getPaymentSettings();

  // OCR — faqat ma'lumot ajratish + ogohlantirish, tasdiqlash EMAS (services/receiptOcr.js ga qarang)
  const ocr = await analyzeReceipt(filePath, { expectedAmount: finalAmount, adminCardNumber: paymentSettings.cardNumber });

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
adminPayments.use(requireAuth, loadCurrentUser, requireAdminUser);

// GET /api/admin/payments/settings — joriy to'lov karta ma'lumotlari
adminPayments.get("/settings", asyncHandler(async (_req, res) => {
  const settings = await getPaymentSettings();
  res.json({ cardNumber: settings.cardNumber, cardOwner: settings.cardOwner, updatedAt: settings.updatedAt });
}));

// PATCH /api/admin/payments/settings  { cardNumber, cardOwner }
// Admin panel orqali karta ma'lumotlarini o'zgartirish — deploy yoki .env
// tahriri shart emas, darhol kuchga kiradi (keyingi to'lov ekranlarida ham,
// OCR solishtirishda ham).
adminPayments.patch("/settings", asyncHandler(async (req, res) => {
  const { cardNumber, cardOwner } = req.body;
  if (!cardNumber || !cardNumber.trim()) {
    return res.status(400).json({ error: "Karta raqami bo'sh bo'lmasligi kerak" });
  }
  if (!cardOwner || !cardOwner.trim()) {
    return res.status(400).json({ error: "Karta egasi bo'sh bo'lmasligi kerak" });
  }

  const settings = await prisma.paymentSettings.upsert({
    where: { id: 1 },
    update: { cardNumber: cardNumber.trim(), cardOwner: cardOwner.trim(), updatedById: req.user.id },
    create: { id: 1, cardNumber: cardNumber.trim(), cardOwner: cardOwner.trim(), updatedById: req.user.id },
  });

  await logAdminAction(req.user.id, "PAYMENT_SETTINGS_UPDATED", { details: cardNumber.trim() });

  res.json({ cardNumber: settings.cardNumber, cardOwner: settings.cardOwner, updatedAt: settings.updatedAt });
}));

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
adminPayments.post("/:id/approve", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const payment = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!payment) return res.status(404).json({ error: "To'lov topilmadi" });
  if (payment.status !== "PENDING") return res.status(400).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });

  const now = new Date();

  // Mavjud premium ustiga qo'shiladi — agar foydalanuvchining amaldagi obunasi
  // bo'lsa, yangi oy uning tugash sanasidan boshlanadi. Ilgari har doim
  // "bugundan +30 kun" edi, ya'ni oldindan to'lagan foydalanuvchi qolgan
  // kunlarini yo'qotardi.
  const currentUser = await prisma.user.findUnique({ where: { id: payment.userId } });
  const base =
    currentUser?.premiumExpiresAt && currentUser.premiumExpiresAt > now
      ? currentUser.premiumExpiresAt
      : now;
  const expires = new Date(base);
  expires.setDate(expires.getDate() + (findPlan(payment.planKey)?.durationDays ?? PREMIUM_DAYS_PER_PURCHASE));

  // Ikki admin bir vaqtda Approve bosishi mumkin. `updateMany` + status sharti
  // atomik: faqat hali PENDING bo'lgan yozuvni yangilaydi, shuning uchun
  // ikkinchi urinish 0 qator yangilaydi va premium ikki marta berilmaydi.
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentRequest.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: req.user.id, reviewedAt: now },
    });

    if (updated.count === 0) return { applied: false };

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        isPremium: true,
        premiumPlan: payment.planKey,
        premiumStartedAt: currentUser?.premiumStartedAt || now,
        premiumExpiresAt: expires,
      },
    });

    return { applied: true };
  });

  if (!result.applied) {
    return res.status(409).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });
  }

  await logActivity(payment.userId, "PAYMENT_APPROVED", `${payment.planName} to'lovi tasdiqlandi`, { paymentId: id });
  await logActivity(payment.userId, "PREMIUM_GRANTED", `${payment.planName} tarifi faollashtirildi`);
  await logAdminAction(req.user.id, "PAYMENT_APPROVED", { targetUserId: payment.userId, details: payment.planName });

  res.json({ ok: true });
}));

// POST /api/admin/payments/:id/reject  { reason }
adminPayments.post("/:id/reject", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { reason } = req.body;
  const payment = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!payment) return res.status(404).json({ error: "To'lov topilmadi" });
  if (payment.status !== "PENDING") return res.status(400).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });

  const rejected = await prisma.paymentRequest.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "REJECTED", rejectionReason: reason ? String(reason).slice(0, 500) : null, reviewedById: req.user.id, reviewedAt: new Date() },
  });

  if (rejected.count === 0) {
    return res.status(409).json({ error: "Bu to'lov allaqachon ko'rib chiqilgan" });
  }

  await logActivity(payment.userId, "PAYMENT_REJECTED", reason || "To'lov rad etildi", { paymentId: id });
  await logAdminAction(req.user.id, "PAYMENT_REJECTED", { targetUserId: payment.userId, details: reason || "" });

  res.json({ ok: true });
}));

export { adminPayments };
