import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser, requireAdminUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireIdParam } from "../lib/validate.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth, loadCurrentUser, requireAdminUser);

// GET /api/admin/notifications
notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });
  res.json({ notifications, unreadCount });
}));

// PATCH /api/admin/notifications/:id/read
notificationsRouter.patch("/:id/read", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  await prisma.notification.updateMany({
    where: { id, userId: req.user.id },
    data: { isRead: true },
  });
  res.json({ ok: true });
}));

// PATCH /api/admin/notifications/read-all
notificationsRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
}));
