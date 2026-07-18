import { Router } from "express";
import { prisma } from "../db.js";
import { verifyTelegramInitData } from "../telegramAuth.js";
import { signToken } from "../authMiddleware.js";

export const authRouter = Router();

// Admin bo'ladigan Telegram ID'lar — .env dagi ADMIN_TELEGRAM_IDS orqali beriladi
// masalan: ADMIN_TELEGRAM_IDS=123456789,987654321
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

authRouter.post("/telegram", async (req, res) => {
  const { initData } = req.body;

  const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  const tgUser = result.user;
  const telegramId = BigInt(tgUser.id);
  const isAdmin = ADMIN_IDS.includes(String(tgUser.id));

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      // Admin ro'yxatida bo'lsa, har kirishda ADMIN bo'lib turadi;
      // aks holda mavjud rol saqlanib qoladi (avval qo'lda ADMIN qilingan bo'lsa ham buzilmaydi).
      ...(isAdmin ? { role: "ADMIN" } : {}),
    },
    create: {
      telegramId,
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      role: isAdmin ? "ADMIN" : "USER",
    },
  });

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      examReadiness: user.examReadiness,
    },
  });
});
