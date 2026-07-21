import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth, requireAdmin);

// GET /api/admin/notifications
notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.auth.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({
    where: { userId: req.auth.sub, isRead: false },
  });
  res.json({ notifications, unreadCount });
}));

// PATCH /api/admin/notifications/:id/read
notificationsRouter.patch("/:id/read", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  await prisma.notification.updateMany({
    where: { id, userId: req.auth.sub },
    data: { isRead: true },
  });
  res.json({ ok: true });
}));

// PATCH /api/admin/notifications/read-all
notificationsRouter.patch("/read-all", asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.auth.sub, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
}));
