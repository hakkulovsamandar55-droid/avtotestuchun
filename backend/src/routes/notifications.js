import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// PATCH /api/notifications/toggle — Mini App ichidan bildirishnomani yoqish/o'chirish.
// Bot (bot/ papkasi) shu users.notifications_enabled ustunini o'qib, kimga
// eslatma yuborishini shundan aniqlaydi — bu yerda faqat flag saqlanadi,
// xabar yuborish bot tomonida bo'ladi.
notificationsRouter.patch("/toggle", asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled boolean bo'lishi kerak" });
  }

  const user = await prisma.user.update({
    where: { id: req.auth.sub },
    data: { notificationsEnabled: enabled },
  });

  res.json({ notificationsEnabled: user.notificationsEnabled });
}));
