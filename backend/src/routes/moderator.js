import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser, requireModeratorOrAdminUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";

// ============================================================================
// MINI-ADMIN (MODERATOR) UCHUN CHEKLANGAN BO'LIM
//
// Bu router faqat ikkita narsa uchun: (1) foydalanuvchilarning ASOSIY
// ma'lumotini ko'rish (ism, username, premium holati, ro'yxatdan o'tgan
// sana) va (2) umumiy statistika. Chek tasdiqlash/rad etish esa
// routes/payments.js ichidagi adminPayments routerida — u ham
// requireModeratorOrAdminUser bilan ochilgan.
//
// MUHIM: bu yerda ATAYLAB telefon raqami, tayyorgarlik foizi, faollik va h.k.
// qaytarilmaydi — mini-adminga faqat "kim, qachon, premiummi" ko'rinishi kerak,
// to'liq profil emas (bu ADMIN'ning /api/admin/users/:id/profile'i orqali).
// ============================================================================

export const moderatorRouter = Router();

moderatorRouter.use(requireAuth, loadCurrentUser, requireModeratorOrAdminUser);

// GET /api/moderator/users?query=...
// Oddiy qidiruv + ro'yxat, faqat asosiy maydonlar bilan.
moderatorRouter.get("/users", asyncHandler(async (req, res) => {
  const query = (req.query.query || "").trim();

  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ],
      }
    : undefined;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      username: true,
      isPremium: true,
      premiumExpiresAt: true,
      createdAt: true,
    },
  });

  res.json({ users, count: users.length });
}));

// GET /api/moderator/stats — mini-admin uchun umumiy ko'rsatkichlar
moderatorRouter.get("/stats", asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    premiumUsers,
    registeredToday,
    registeredThisWeek,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.paymentRequest.count({ where: { status: "PENDING" } }),
    prisma.paymentRequest.count({ where: { status: "APPROVED" } }),
    prisma.paymentRequest.count({ where: { status: "REJECTED" } }),
  ]);

  res.json({
    totalUsers,
    premiumUsers,
    registeredToday,
    registeredThisWeek,
    payments: {
      pending: pendingPayments,
      approved: approvedPayments,
      rejected: rejectedPayments,
    },
  });
}));
