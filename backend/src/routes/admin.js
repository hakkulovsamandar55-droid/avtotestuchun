import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";
import { logActivity, logAdminAction } from "../services/activity.js";

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

adminRouter.use(requireAuth, requireAdmin);

// ============================== FOYDALANUVCHILAR RO'YXATI ==============================

// GET /api/admin/users?query=...
adminRouter.get("/users", asyncHandler(async (req, res) => {
  const query = (req.query.query || "").trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
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
    },
  });

  res.json({
    users: users.map((u) => ({
      ...u,
      telegramId: u.telegramId.toString(),
      isSuperAdmin: isSuperAdmin(u.telegramId),
    })),
    count: users.length,
  });
}));

// ============================== FOYDALANUVCHI PROFILI ==============================

// GET /api/admin/users/:id/profile — to'liq profil: umumiy, statistika, premium, to'lovlar, timeline
adminRouter.get("/users/:id/profile", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      discount: true,
      conversation: { select: { id: true, status: true, unreadForAdmin: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const attempts = await prisma.attempt.findMany({ where: { userId: id } });
  const testsCompleted = attempts.length;
  const correctAnswers = attempts.reduce((sum, a) => sum + a.correctCount, 0);
  const totalAnswers = attempts.reduce((sum, a) => sum + a.totalCount, 0);
  const wrongAnswers = totalAnswers - correctAnswers;
  const successPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const averageScore = testsCompleted > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.totalCount > 0 ? (a.correctCount / a.totalCount) * 100 : 0), 0) / testsCompleted)
    : 0;
  const lastActivity = attempts.length > 0
    ? attempts.reduce((latest, a) => (a.createdAt > latest ? a.createdAt : latest), attempts[0].createdAt)
    : null;

  const payments = await prisma.paymentRequest.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
  });

  const activities = await prisma.activityLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
adminRouter.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (role !== "ADMIN" && role !== "USER") {
    return res.status(400).json({ error: "role ADMIN yoki USER bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  if (isSuperAdmin(target.telegramId) && role === "USER") {
    return res.status(403).json({ error: "Bosh adminning rolini bu yerdan o'zgartirib bo'lmaydi" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, username: true, role: true, isPremium: true },
  });

  await logActivity(id, role === "ADMIN" ? "MADE_ADMIN" : "REMOVED_ADMIN", role === "ADMIN" ? "Admin etib tayinlandi" : "Admin huquqi olib tashlandi");
  await logAdminAction(req.auth.sub, role === "ADMIN" ? "ADMIN_GRANTED" : "ADMIN_REMOVED", { targetUserId: id, targetLabel: target.name });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/premium  { isPremium, planKey?, days? }
adminRouter.patch("/users/:id/premium", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { isPremium, planKey, days } = req.body;

  if (typeof isPremium !== "boolean") {
    return res.status(400).json({ error: "isPremium true yoki false bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  const now = new Date();
  const data = { isPremium };
  if (isPremium) {
    data.premiumPlan = planKey || target.premiumPlan || "pro";
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

  await logActivity(id, "PREMIUM_GRANTED", isPremium ? `Premium (${data.premiumPlan}) qo'lda berildi` : "Premium olib tashlandi");
  await logAdminAction(req.auth.sub, "PREMIUM_GRANTED", { targetUserId: id, targetLabel: target.name, details: data.premiumPlan || "" });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/premium/extend  { days }
adminRouter.patch("/users/:id/premium/extend", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
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
  await logAdminAction(req.auth.sub, "PREMIUM_EXTENDED", { targetUserId: id, targetLabel: target.name, details: `${days} kun` });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/block  { blocked: true|false, reason? }
adminRouter.patch("/users/:id/block", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { blocked, reason } = req.body;
  if (typeof blocked !== "boolean") return res.status(400).json({ error: "blocked true yoki false bo'lishi kerak" });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  if (isSuperAdmin(target.telegramId) && blocked) {
    return res.status(403).json({ error: "Bosh adminni bloklab bo'lmaydi" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked: blocked, blockedReason: blocked ? (reason || null) : null },
    select: { id: true, isBlocked: true },
  });

  await logActivity(id, blocked ? "BLOCKED" : "UNBLOCKED", blocked ? (reason || "Foydalanuvchi bloklandi") : "Foydalanuvchi blokdan chiqarildi");
  await logAdminAction(req.auth.sub, blocked ? "USER_BLOCKED" : "USER_UNBLOCKED", { targetUserId: id, targetLabel: target.name, details: reason || "" });

  res.json({ user });
}));

// DELETE /api/admin/users/:id — faqat Super Admin
adminRouter.delete("/users/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!isSuperAdmin(req.auth.telegramId)) {
    return res.status(403).json({ error: "Hisobni o'chirish faqat bosh admin uchun" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  if (isSuperAdmin(target.telegramId)) {
    return res.status(403).json({ error: "Bosh adminni o'chirib bo'lmaydi" });
  }

  await logAdminAction(req.auth.sub, "ACCOUNT_DELETED", { targetUserId: null, targetLabel: target.name, details: `id=${id}` });

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

// ============================== CHEGIRMA ==============================

// PATCH /api/admin/users/:id/discount  { percent, expiresAt? }
adminRouter.patch("/users/:id/discount", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
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
  await logAdminAction(req.auth.sub, "DISCOUNT_GRANTED", { targetUserId: id, targetLabel: target.name, details: `${percent}%` });

  res.json({ discount });
}));

// DELETE /api/admin/users/:id/discount
adminRouter.delete("/users/:id/discount", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  await prisma.discount.deleteMany({ where: { userId: id } });
  await logAdminAction(req.auth.sub, "DISCOUNT_REMOVED", { targetUserId: id, targetLabel: target.name });

  res.json({ ok: true });
}));

// ============================== BROADCAST ==============================

// POST /api/admin/broadcast  { text, audience: ALL|PREMIUM|VIP|BLOCKED|SELECTED, userIds? }
// ESLATMA: bu yerda faqat qabul qiluvchilar ro'yxati tayyorlanadi va yozuv saqlanadi.
// Haqiqiy Telegram xabarini yuborish uchun bot/ jarayoniga ulanish kerak (bot.py) —
// bu qism hozircha "ro'yxatni tayyorlash + hisobni saqlash"gacha ishlaydi.
adminRouter.post("/broadcast", asyncHandler(async (req, res) => {
  const { text, audience, userIds } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: "Xabar matni bo'sh bo'lmasligi kerak" });

  const validAudiences = ["ALL", "PREMIUM", "VIP", "BLOCKED", "SELECTED"];
  if (!validAudiences.includes(audience)) {
    return res.status(400).json({ error: `audience quyidagilardan biri bo'lishi kerak: ${validAudiences.join(", ")}` });
  }

  let where = {};
  if (audience === "PREMIUM") where = { isPremium: true };
  else if (audience === "VIP") where = { isPremium: true, premiumPlan: "vip" };
  else if (audience === "BLOCKED") where = { isBlocked: true };
  else if (audience === "SELECTED") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "SELECTED uchun userIds ro'yxati kerak" });
    }
    where = { id: { in: userIds.map(Number) } };
  }

  const recipients = await prisma.user.findMany({ where, select: { id: true, telegramId: true } });

  const broadcast = await prisma.broadcastMessage.create({
    data: { text: text.trim(), audience, sentCount: recipients.length },
  });

  await logAdminAction(req.auth.sub, "BROADCAST_SENT", { details: `${audience}: ${recipients.length} ta foydalanuvchi` });

  res.status(201).json({
    broadcast,
    recipientCount: recipients.length,
    recipientTelegramIds: recipients.map((r) => r.telegramId.toString()),
  });
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
