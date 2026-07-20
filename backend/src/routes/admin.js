import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const adminRouter = Router();

// .env dagi ADMIN_TELEGRAM_IDS ro'yxatidagilar "bosh admin" hisoblanadi —
// ularning ADMIN roli admin panel orqali olib tashlanmaydi (faqat .env orqali).
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isSuperAdmin(telegramId) {
  return ADMIN_IDS.includes(String(telegramId));
}

// Bu bo'limdagi HAR BIR endpoint avval requireAuth (token borligini),
// keyin requireAdmin (rol ADMIN ekanligini) tekshiradi.
adminRouter.use(requireAuth, requireAdmin);

// GET /api/admin/users?query=ism-yoki-username-yoki-telefon
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

// PATCH /api/admin/users/:id/role  { role: "ADMIN" | "USER" }
adminRouter.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { role } = req.body;

  if (role !== "ADMIN" && role !== "USER") {
    return res.status(400).json({ error: "role ADMIN yoki USER bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  // Bosh admin (.env dagi ADMIN_TELEGRAM_IDS) roli admin panel orqali o'zgartirilmaydi —
  // aks holda tasodifan yagona adminni USER qilib qo'yish xavfi bo'ladi.
  if (isSuperAdmin(target.telegramId) && role === "USER") {
    return res.status(403).json({ error: "Bosh adminning rolini bu yerdan o'zgartirib bo'lmaydi" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, username: true, role: true, isPremium: true },
  });

  res.json({ user });
}));

// PATCH /api/admin/users/:id/premium  { isPremium: true | false }
adminRouter.patch("/users/:id/premium", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { isPremium } = req.body;

  if (typeof isPremium !== "boolean") {
    return res.status(400).json({ error: "isPremium true yoki false bo'lishi kerak" });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isPremium },
    select: { id: true, name: true, username: true, role: true, isPremium: true },
  });

  res.json({ user });
}));
