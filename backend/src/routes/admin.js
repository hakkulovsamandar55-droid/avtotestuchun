import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser, requireAdminUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { logActivity, logAdminAction } from "../services/activity.js";
import { requireIdParam } from "../lib/validate.js";
import {
  getExamOverview,
  getQuestionDifficultyStats,
  getUserExamSummary,
} from "../services/examAnalyticsService.js";

export const adminRouter = Router();

// .env dagi ADMIN_TELEGRAM_IDS ro'yxatidagilar "bosh admin" (Super Admin) hisoblanadi —
// ularning ADMIN roli admin panel orqali olib tashlanmaydi va faqat ular hisobni o'chira oladi.
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isSuperAdmin(telegramId) {
  return ADMIN_IDS.includes(String(telegramId));
}

const VALID_DISCOUNTS = [0, 10, 20, 30, 50, 75, 100];

adminRouter.use(requireAuth, loadCurrentUser, requireAdminUser);

// ============================== FOYDALANUVCHILAR RO'YXATI ==============================

// GET /api/admin/users?query=...
// Kunning boshlanishi (00:00) — "bugun ro'yxatdan o'tgan/faol bo'lgan" kabi
// filtrlar shu nuqtadan hisoblanadi.
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// Spec 2-bo'lim: "Smart User Filters" — bir nechta filtr bir vaqtda
// qo'llanishi mumkin (masalan Premium + Inactive 7 Days). Har bir filtr
// mustaqil Prisma shart to'plami qaytaradi, keyin barchasi AND bilan
// birlashtiriladi.
function buildFilterConditions(filters) {
  const conditions = [];

  for (const key of filters) {
    switch (key) {
      case "premium":
        conditions.push({ isPremium: true });
        break;
      case "free":
        conditions.push({ isPremium: false });
        break;
      case "admin":
        conditions.push({ role: "ADMIN" });
        break;
      case "blocked":
        conditions.push({ isBlocked: true });
        break;
      case "registeredToday":
        conditions.push({ createdAt: { gte: startOfToday() } });
        break;
      case "registeredThisWeek":
        conditions.push({ createdAt: { gte: daysAgo(7) } });
        break;
      case "registeredThisMonth":
        conditions.push({ createdAt: { gte: daysAgo(30) } });
        break;
      case "activeToday":
        conditions.push({ lastOnlineAt: { gte: startOfToday() } });
        break;
      case "active3Days":
        conditions.push({ lastOnlineAt: { gte: daysAgo(3) } });
        break;
      case "active7Days":
        conditions.push({ lastOnlineAt: { gte: daysAgo(7) } });
        break;
      case "active30Days":
        conditions.push({ lastOnlineAt: { gte: daysAgo(30) } });
        break;
      case "neverPurchasedPremium":
        conditions.push({ paymentRequests: { none: { status: "APPROVED" } } });
        break;
      case "purchasedPremium":
        conditions.push({ paymentRequests: { some: { status: "APPROVED" } } });
        break;
      case "referralUsers":
        conditions.push({ referredById: { not: null } });
        break;
      // "Faollik" — yechilgan testlar soniga qarab taxminiy bo'lingan
      // (30+ = yuqori, 1-29 = past). Ikkalasi ham pastda JS tomonida hisoblanadi,
      // chunki _count bo'yicha to'g'ridan-to'g'ri WHERE shart qo'yish qulay emas.
      case "highActivity":
      case "lowActivity":
        break;
      // Imtihon sanasi keyingi 14 kun ichida bo'lgan foydalanuvchilar (onboarding'da kiritiladi)
      case "examSoon": {
        const in14Days = new Date();
        in14Days.setDate(in14Days.getDate() + 14);
        conditions.push({ examDate: { gte: new Date(), lte: in14Days } });
        break;
      }
      default:
        break;
    }
  }

  return conditions;
}

adminRouter.get("/users", asyncHandler(async (req, res) => {
  const query = (req.query.query || "").trim();
  const filters = (req.query.filters || "")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const searchCondition = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      }
    : null;

  const filterConditions = buildFilterConditions(filters);

  const AND = [...(searchCondition ? [searchCondition] : []), ...filterConditions];

  let users = await prisma.user.findMany({
    where: AND.length > 0 ? { AND } : undefined,
    orderBy: { createdAt: "desc" },
    take: filters.includes("highActivity") || filters.includes("lowActivity") ? 500 : 50,
    select: {
      id: true,
      telegramId: true,
      name: true,
      username: true,
      phone: true,
      examReadiness: true,
      role: true,
      isPremium: true,
      isBlocked: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { attempts: true } },
    },
  });

  // Faollik darajasi DB tomonida oson ifodalanmaydigan chegara bo'lgani uchun
  // (yechilgan testlar soni), shu ikki filtr JS tomonida qo'llanadi.
  if (filters.includes("highActivity")) {
    users = users.filter((u) => u._count.attempts >= 30);
  }
  if (filters.includes("lowActivity")) {
    users = users.filter((u) => u._count.attempts > 0 && u._count.attempts < 10);
  }
  users = users.slice(0, 50);

  res.json({
    users: users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId.toString(),
      name: u.name,
      username: u.username,
      phone: u.phone,
      examReadiness: u.examReadiness,
      role: u.role,
      isPremium: u.isPremium,
      isBlocked: u.isBlocked,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
      testsCompleted: u._count.attempts,
      isSuperAdmin: isSuperAdmin(u.telegramId),
    })),
    count: users.length,
  });
}));

// ============================== FOYDALANUVCHI PROFILI ==============================

// GET /api/admin/users/:id/profile — to'liq profil: umumiy, statistika, premium, to'lovlar, timeline
adminRouter.get("/users/:id/profile", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      discount: true,
      conversation: { select: { id: true, status: true, unreadForAdmin: true } },
      referredBy: { select: { id: true, name: true, username: true } },
      referrals: { select: { id: true, name: true, username: true, isPremium: true, createdAt: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  // Ilgari bu yerda foydalanuvchining BARCHA urinishlari xotiraga yuklanardi
  // (`findMany` cheklovsiz), keyin JS'da yig'ilardi. Faol foydalanuvchida bu
  // minglab qatorni anglatadi va profil ochilishi sekinlashadi. Endi yig'indi
  // DB'da hisoblanadi — bitta arzon so'rov, hajmdan qat'i nazar bir xil tez.
  //
  // O'rtacha ball (averageScore) uchun har bir urinishning foizi kerak, uni
  // SQL'siz aniq hisoblab bo'lmaydi, shuning uchun oxirgi 500 urinish bilan
  // cheklaymiz — statistik jihatdan yetarli namuna.
  const [aggregate, recentForAverage, lastAttempt, payments, activities] = await Promise.all([
    prisma.attempt.aggregate({
      where: { userId: id },
      _count: { _all: true },
      _sum: { correctCount: true, totalCount: true },
    }),
    prisma.attempt.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { correctCount: true, totalCount: true },
    }),
    prisma.attempt.findFirst({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.paymentRequest.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.activityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const testsCompleted = aggregate._count._all;
  const correctAnswers = aggregate._sum.correctCount || 0;
  const totalAnswers = aggregate._sum.totalCount || 0;
  const wrongAnswers = totalAnswers - correctAnswers;
  const successPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const averageScore =
    recentForAverage.length > 0
      ? Math.round(
          recentForAverage.reduce(
            (sum, a) => sum + (a.totalCount > 0 ? (a.correctCount / a.totalCount) * 100 : 0),
            0
          ) / recentForAverage.length
        )
      : 0;
  const lastActivity = lastAttempt?.createdAt || null;

  res.json({
    general: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      name: user.name,
      username: user.username,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isSuperAdmin: isSuperAdmin(user.telegramId),
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      registeredAt: user.createdAt,
      lastOnlineAt: user.lastOnlineAt,
      adminNotes: user.adminNotes,
      age: user.age,
      dailyStudyMinutes: user.dailyStudyMinutes,
    },
    statistics: {
      testsCompleted,
      correctAnswers,
      wrongAnswers,
      aiRating: user.examReadiness,
      successPercent,
      averageScore,
      lastActivity,
    },
    premium: {
      isPremium: user.isPremium,
      plan: user.premiumPlan,
      startedAt: user.premiumStartedAt,
      expiresAt: user.premiumExpiresAt,
    },
    discount: user.discount
      ? {
          percent: user.discount.percent,
          expiresAt: user.discount.expiresAt,
          isExpired: Boolean(user.discount.expiresAt && user.discount.expiresAt < new Date()),
        }
      : null,
    referral: {
      code: user.referralCode,
      referredBy: user.referredBy ? { id: user.referredBy.id, name: user.referredBy.name, username: user.referredBy.username } : null,
      referralsCount: user.referrals.length,
      referrals: user.referrals.map((r) => ({ id: r.id, name: r.name, username: r.username, isPremium: r.isPremium, joinedAt: r.createdAt })),
    },
    payments: payments.map((p) => ({
      id: p.id,
      planName: p.planName,
      amount: p.amount,
      status: p.status,
      createdAt: p.createdAt,
    })),
    conversation: user.conversation,
    timeline: activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      createdAt: a.createdAt,
    })),
  });
}));

// ============================== ROL / BLOKLASH ==============================

// PATCH /api/admin/users/:id/role  { role: "ADMIN" | "USER" }
adminRouter.patch("/users/:id/role", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { role } = req.body;

  if (role !== "ADMIN" && role !== "USER") {
    return res.status(400).json({ error: "role ADMIN yoki USER bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  if (isSuperAdmin(target.telegramId) && role === "USER") {
    return res.status(403).json({ error: "Bosh adminning rolini bu yerdan o'zgartirib bo'lmaydi" });
  }
  // Admin o'zidan admin huquqini olib tashlasa, ortga qaytara olmaydi
  if (id === req.user.id && role === "USER") {
    return res.status(400).json({ error: "O'zingizdan admin huquqini olib tashlay olmaysiz" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, username: true, role: true, isPremium: true },
  });

  await logActivity(id, role === "ADMIN" ? "MADE_ADMIN" : "REMOVED_ADMIN", role === "ADMIN" ? "Admin etib tayinlandi" : "Admin huquqi olib tashlandi");
  await logAdminAction(req.user.id, role === "ADMIN" ? "ADMIN_GRANTED" : "ADMIN_REMOVED", { targetUserId: id, targetLabel: target.name });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/premium  { isPremium, planKey?, days? }
adminRouter.patch("/users/:id/premium", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { isPremium, planKey, days } = req.body;

  if (typeof isPremium !== "boolean") {
    return res.status(400).json({ error: "isPremium true yoki false bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const now = new Date();
  const data = { isPremium };
  if (isPremium) {
    // "pro" endi mahsulot nomi emas — muddat kalitlaridan biri (days15/days30/days90)
    // ishlatiladi. Admin aniq kalit bermasa, standart 30 kunlik tarif tanlanadi.
    data.premiumPlan = planKey || target.premiumPlan || "days30";
    data.premiumStartedAt = now;
    const expires = new Date(now);
    expires.setDate(expires.getDate() + (Number(days) || 30));
    data.premiumExpiresAt = expires;
  } else {
    data.premiumPlan = null;
    data.premiumExpiresAt = null;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, role: true, isPremium: true, premiumExpiresAt: true },
  });

  // Ilgari premium OLIB TASHLANGANDA ham "PREMIUM_GRANTED" deb yozilardi —
  // audit jurnali noto'g'ri bo'lib, kim premiumni bekor qilganini topib
  // bo'lmasdi. Endi harakat turi to'g'ri belgilanadi.
  await logActivity(
    id,
    isPremium ? "PREMIUM_GRANTED" : "PREMIUM_EXPIRED",
    isPremium ? `Premium (${data.premiumPlan}) qo'lda berildi` : "Premium olib tashlandi"
  );
  await logAdminAction(req.user.id, isPremium ? "PREMIUM_GRANTED" : "PREMIUM_REMOVED", {
    targetUserId: id,
    targetLabel: target.name,
    details: data.premiumPlan || "",
  });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/premium/extend  { days }
adminRouter.patch("/users/:id/premium/extend", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const days = Number(req.body.days);
  if (!days || days <= 0) return res.status(400).json({ error: "days musbat son bo'lishi kerak" });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const base = target.premiumExpiresAt && target.premiumExpiresAt > new Date() ? target.premiumExpiresAt : new Date();
  const newExpiry = new Date(base);
  newExpiry.setDate(newExpiry.getDate() + days);

  const user = await prisma.user.update({
    where: { id },
    data: { isPremium: true, premiumExpiresAt: newExpiry },
    select: { id: true, premiumExpiresAt: true },
  });

  await logActivity(id, "PREMIUM_EXTENDED", `Premium ${days} kunga uzaytirildi`);
  await logAdminAction(req.user.id, "PREMIUM_EXTENDED", { targetUserId: id, targetLabel: target.name, details: `${days} kun` });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/block  { blocked: true|false, reason? }
adminRouter.patch("/users/:id/block", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { blocked, reason } = req.body;
  if (typeof blocked !== "boolean") return res.status(400).json({ error: "blocked true yoki false bo'lishi kerak" });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  if (isSuperAdmin(target.telegramId) && blocked) {
    return res.status(403).json({ error: "Bosh adminni bloklab bo'lmaydi" });
  }
  // O'zini bloklab qo'yish — qaytarib bo'lmaydigan xato bo'lardi
  // (bloklangan admin endi admin panelga kira olmaydi).
  if (id === req.user.id && blocked) {
    return res.status(400).json({ error: "O'zingizni bloklay olmaysiz" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked: blocked, blockedReason: blocked ? (reason || null) : null },
    select: { id: true, isBlocked: true },
  });

  await logActivity(id, blocked ? "BLOCKED" : "UNBLOCKED", blocked ? (reason || "Foydalanuvchi bloklandi") : "Foydalanuvchi blokdan chiqarildi");
  await logAdminAction(req.user.id, blocked ? "USER_BLOCKED" : "USER_UNBLOCKED", { targetUserId: id, targetLabel: target.name, details: reason || "" });

  res.json({ user });
}));

// DELETE /api/admin/users/:id — faqat Super Admin
adminRouter.delete("/users/:id", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  // Tokendagi telegramId emas, DB'dan yuklangan haqiqiy foydalanuvchi —
  // token qalbakilashtirilgan yoki eskirgan bo'lsa ham to'g'ri ishlaydi.
  if (!isSuperAdmin(req.user.telegramId)) {
    return res.status(403).json({ error: "Hisobni o'chirish faqat bosh admin uchun" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  if (isSuperAdmin(target.telegramId)) {
    return res.status(403).json({ error: "Bosh adminni o'chirib bo'lmaydi" });
  }
  if (id === req.user.id) {
    return res.status(400).json({ error: "O'z hisobingizni o'chira olmaysiz" });
  }

  await logAdminAction(req.user.id, "ACCOUNT_DELETED", { targetUserId: null, targetLabel: target.name, details: `id=${id}` });

  // Bog'liq yozuvlarni ketma-ket o'chiramiz (Prisma cascade sozlanmagani uchun)
  await prisma.$transaction([
    prisma.supportMessage.deleteMany({ where: { conversation: { userId: id } } }),
    prisma.conversation.deleteMany({ where: { userId: id } }),
    prisma.paymentRequest.deleteMany({ where: { userId: id } }),
    prisma.discount.deleteMany({ where: { userId: id } }),
    prisma.activityLog.deleteMany({ where: { userId: id } }),
    prisma.notification.deleteMany({ where: { userId: id } }),
    prisma.attempt.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  res.json({ ok: true });
}));

// ============================== ADMIN NOTES ==============================

// PATCH /api/admin/users/:id/notes  { notes }
// Faqat adminlar orasida ko'rinadigan shaxsiy eslatma — foydalanuvchiga hech qachon ko'rsatilmaydi.
adminRouter.patch("/users/:id/notes", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { notes } = req.body;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const user = await prisma.user.update({
    where: { id },
    data: { adminNotes: typeof notes === "string" ? notes.slice(0, 2000) : null },
    select: { id: true, adminNotes: true },
  });

  res.json({ user });
}));

// ============================== CHEGIRMA ==============================

// PATCH /api/admin/users/:id/discount  { percent, expiresAt? }
adminRouter.patch("/users/:id/discount", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { percent, expiresAt } = req.body;

  if (!VALID_DISCOUNTS.includes(Number(percent))) {
    return res.status(400).json({ error: `percent quyidagilardan biri bo'lishi kerak: ${VALID_DISCOUNTS.join(", ")}` });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const discount = await prisma.discount.upsert({
    where: { userId: id },
    update: { percent: Number(percent), expiresAt: expiresAt ? new Date(expiresAt) : null },
    create: { userId: id, percent: Number(percent), expiresAt: expiresAt ? new Date(expiresAt) : null },
  });

  await logActivity(id, "DISCOUNT_GRANTED", `${percent}% chegirma berildi`);
  await logAdminAction(req.user.id, "DISCOUNT_GRANTED", { targetUserId: id, targetLabel: target.name, details: `${percent}%` });

  res.json({ discount });
}));

// DELETE /api/admin/users/:id/discount
adminRouter.delete("/users/:id/discount", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  await prisma.discount.deleteMany({ where: { userId: id } });
  await logAdminAction(req.user.id, "DISCOUNT_REMOVED", { targetUserId: id, targetLabel: target.name });

  res.json({ ok: true });
}));

// ============================== BROADCAST ==============================

// POST /api/admin/broadcast  { text, audience: ALL|PREMIUM|VIP|BLOCKED|SELECTED, userIds? }
// ESLATMA: bu yerda faqat qabul qiluvchilar ro'yxati tayyorlanadi va yozuv saqlanadi.
// Haqiqiy Telegram xabarini yuborish uchun bot/ jarayoniga ulanish kerak (bot.py) —
// bu qism hozircha "ro'yxatni tayyorlash + hisobni saqlash"gacha ishlaydi.
adminRouter.post("/broadcast", asyncHandler(async (req, res) => {
  const { text, audience, userIds } = req.body;
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Xabar matni bo'sh bo'lmasligi kerak" });
  }
  // Telegram bitta xabarda 4096 belgigacha ruxsat beradi — undan uzun matn
  // yuborishga urinish baribir xatoga olib keladi, shuning uchun shu yerda to'xtatamiz.
  const cleanText = text.trim().slice(0, 4096);

  const validAudiences = ["ALL", "PREMIUM", "BLOCKED", "SELECTED"];
  if (!validAudiences.includes(audience)) {
    return res.status(400).json({ error: `audience quyidagilardan biri bo'lishi kerak: ${validAudiences.join(", ")}` });
  }

  let where = {};
  if (audience === "PREMIUM") where = { isPremium: true };
  else if (audience === "BLOCKED") where = { isBlocked: true };
  else if (audience === "SELECTED") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "SELECTED uchun userIds ro'yxati kerak" });
    }
    // Faqat yaroqli raqamli ID'lar — NaN Prisma so'rovini buzadi.
    const ids = userIds.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 1000);
    if (ids.length === 0) {
      return res.status(400).json({ error: "userIds da yaroqli ID topilmadi" });
    }
    where = { id: { in: ids } };
  }

  // Bloklangan foydalanuvchilarga xabar yuborilmaydi (BLOCKED auditoriyasi
  // ataylab tanlangan holatdan tashqari) — ular ilovadan foydalana olmaydi.
  if (audience !== "BLOCKED") {
    where = { ...where, isBlocked: false };
  }

  const recipientCount = await prisma.user.count({ where });

  const broadcast = await prisma.broadcastMessage.create({
    data: { text: cleanText, audience, sentCount: recipientCount },
  });

  await logAdminAction(req.user.id, "BROADCAST_SENT", { details: `${audience}: ${recipientCount} ta foydalanuvchi` });

  // MUHIM: ilgari bu yerda barcha qabul qiluvchilarning Telegram ID'lari
  // javobda qaytarilardi. Bu shaxsiy ma'lumotlarning keraksiz oshkor bo'lishi
  // edi — brauzer konsolida yoki tarmoq jurnalida butun foydalanuvchi bazasi
  // ko'rinib qolardi. Xabarni haqiqiy yuborish backend (bot) vazifasi,
  // shuning uchun clientga faqat son qaytariladi.
  res.status(201).json({ broadcast, recipientCount });
}));

// ============================== ADMIN LOG ==============================

// GET /api/admin/logs
adminRouter.get("/logs", asyncHandler(async (_req, res) => {
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, username: true } } },
  });
  res.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      actorName: l.actor.name,
      targetUserId: l.targetUserId,
      targetLabel: l.targetLabel,
      details: l.details,
      createdAt: l.createdAt,
    })),
  });
}));

// ============================== RASMIY IMTIHON ANALITIKASI ==============================

// GET /api/admin/exam/analytics — umumiy ko'rsatkichlar + savol qiyinligi
adminRouter.get("/exam/analytics", asyncHandler(async (_req, res) => {
  const [overview, questions] = await Promise.all([
    getExamOverview(),
    getQuestionDifficultyStats(),
  ]);
  res.json({ overview, questions });
}));

// GET /api/admin/users/:id/exam-summary — foydalanuvchining imtihon xulosasi.
// User Profile ekranida ko'rsatiladi.
adminRouter.get("/users/:id/exam-summary", requireIdParam, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.id }, select: { id: true } });
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  res.json(await getUserExamSummary(req.id));
}));
