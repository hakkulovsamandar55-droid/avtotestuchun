import { Router } from "express";
import { prisma } from "../db.js";
import { verifyTelegramInitData } from "../telegramAuth.js";
import { signToken } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";
import { logActivity, notifyAllAdmins } from "../services/activity.js";

export const authRouter = Router();

// Admin bo'ladigan Telegram ID'lar — .env dagi ADMIN_TELEGRAM_IDS orqali beriladi
// masalan: ADMIN_TELEGRAM_IDS=123456789,987654321
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

authRouter.post("/telegram", asyncHandler(async (req, res) => {
  const { initData } = req.body;

  const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  const tgUser = result.user;
  const telegramId = BigInt(tgUser.id);
  const isAdmin = ADMIN_IDS.includes(String(tgUser.id));

  const existing = await prisma.user.findUnique({ where: { telegramId } });

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      lastOnlineAt: new Date(),
      // Admin ro'yxatida bo'lsa, har kirishda ADMIN va Premium bo'lib turadi
      // (barcha cheklovlar olib tashlanadi); aks holda mavjud holat saqlanadi.
      ...(isAdmin ? { role: "ADMIN", isPremium: true } : {}),
    },
    create: {
      telegramId,
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      role: isAdmin ? "ADMIN" : "USER",
      isPremium: isAdmin,
      lastOnlineAt: new Date(),
    },
  });

  // Bloklangan foydalanuvchi kira olmaydi
  if (user.isBlocked) {
    return res.status(403).json({ error: "Hisobingiz bloklangan. Yordam uchun administratorga murojaat qiling." });
  }

  if (!existing) {
    await logActivity(user.id, "REGISTERED", "Ro'yxatdan o'tdi");
    await notifyAllAdmins({
      type: "NEW_REGISTRATION",
      title: "Yangi ro'yxatdan o'tish",
      body: user.name,
      linkType: "user",
      linkId: user.id,
    });
  }

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      isPremium: user.isPremium,
      premiumPlan: user.premiumPlan,
      premiumExpiresAt: user.premiumExpiresAt,
      examReadiness: user.examReadiness,
      isSuperAdmin: isAdmin,
    },
  });
}));
