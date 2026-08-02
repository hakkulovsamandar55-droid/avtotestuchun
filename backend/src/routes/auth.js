import { Router } from "express";
import { prisma } from "../db.js";
import { verifyTelegramInitData } from "../telegramAuth.js";
import { requireAuth, signToken } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { logActivity, notifyAllAdmins } from "../services/activity.js";
import { generateUniqueReferralCode, resolveReferrer } from "../services/referral.js";

export const authRouter = Router();

// Admin bo'ladigan Telegram ID'lar — .env dagi ADMIN_TELEGRAM_IDS orqali beriladi
// masalan: ADMIN_TELEGRAM_IDS=123456789,987654321
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Ro'yxatdan o'tish formasidan keladigan profil ma'lumotlarini tozalab,
// xavfsiz qiymatlarga aylantiradi. Noto'g'ri/yo'q qiymatlar shunchaki
// e'tiborsiz qoldiriladi — bu endpoint har doim ham profil bilan
// chaqirilmaydi (masalan keyingi silent-login'larda).
function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object") return {};
  const out = {};

  if (typeof profile.name === "string" && profile.name.trim()) {
    out.formName = profile.name.trim().slice(0, 80);
  }
  if (profile.age !== undefined && profile.age !== null) {
    const age = Number(profile.age);
    if (Number.isInteger(age) && age >= 5 && age <= 100) out.age = age;
  }
  if (profile.dailyStudyMinutes !== undefined && profile.dailyStudyMinutes !== null) {
    const mins = Number(profile.dailyStudyMinutes);
    if (Number.isInteger(mins) && mins >= 0 && mins <= 1440) out.dailyStudyMinutes = mins;
  }
  return out;
}

authRouter.post("/telegram", asyncHandler(async (req, res) => {
  const { initData, profile, fallbackStartParam } = req.body;

  const result = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
  if (!result.ok) {
    return res.status(401).json({ error: result.reason });
  }

  const tgUser = result.user;
  const telegramId = BigInt(tgUser.id);
  const isAdmin = ADMIN_IDS.includes(String(tgUser.id));

  const existing = await prisma.user.findUnique({ where: { telegramId } });

  // Faqat YANGI foydalanuvchi uchun kerak — mavjud foydalanuvchining referral
  // holatini keyingi kirishlarda qayta hisoblab/o'zgartirib bo'lmaydi.
  let referrer = null;
  let newReferralCode = null;
  if (!existing) {
    newReferralCode = await generateUniqueReferralCode();
    // Avval IMZOLANGAN manba (Telegram Direct Mini App Link orqali
    // kelgan, tasdiqlangan start_param) tekshiriladi. Faqat u bo'lmasa
    // (masalan bot.py orqali "?startapp=" bilan, imzosiz URL
    // parametri sifatida kelgan bo'lsa), fallbackStartParam ishlatiladi.
    // MUHIM: fallbackStartParam soxtalashtirilishi mumkin (imzosiz),
    // lekin hozircha referral hech qanday moddiy mukofot bermaydi —
    // faqat kuzatuv/reyting uchun. Kelajakda referral uchun bonus
    // qo'shilsa, bu qatorni olib tashlash yoki qat'iyroq tekshirish kerak.
    const refCode =
      result.startParam || (typeof fallbackStartParam === "string" ? fallbackStartParam : null);
    referrer = await resolveReferrer(refCode, telegramId);
  }

  // Ro'yxatdan o'tish formasi faqat birinchi marta (yoki hali to'ldirilmagan
  // bo'lsa) yuboriladi — mavjud, allaqachon to'ldirilgan profilni ustidan
  // yozib yubormaslik uchun.
  const cleanProfile = sanitizeProfile(profile);
  const shouldApplyProfile =
    Object.keys(cleanProfile).length > 0 &&
    (!existing || !existing.registrationCompletedAt);

  // Telegramdagi ism bilan foydalanuvchi formada kiritgan ism ustuvor —
  // agar forma orqali ism kelgan bo'lsa, o'shani ishlatamiz.
  const resolvedName =
    cleanProfile.formName ||
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      name: resolvedName,
      username: tgUser.username || null,
      lastOnlineAt: new Date(),
      // Admin ro'yxatida bo'lsa, har kirishda ADMIN va Premium bo'lib turadi
      // (barcha cheklovlar olib tashlanadi); aks holda mavjud holat saqlanadi.
      ...(isAdmin ? { role: "ADMIN", isPremium: true } : {}),
      ...(shouldApplyProfile
        ? {
            age: cleanProfile.age,
            dailyStudyMinutes: cleanProfile.dailyStudyMinutes,
            registrationCompletedAt: new Date(),
          }
        : {}),
    },
    create: {
      telegramId,
      name: resolvedName,
      username: tgUser.username || null,
      role: isAdmin ? "ADMIN" : "USER",
      isPremium: isAdmin,
      lastOnlineAt: new Date(),
      referralCode: newReferralCode,
      referredById: referrer?.id || null,
      age: cleanProfile.age,
      dailyStudyMinutes: cleanProfile.dailyStudyMinutes,
      registrationCompletedAt: Object.keys(cleanProfile).length > 0 ? new Date() : null,
    },
  });

  // Bloklangan foydalanuvchi kira olmaydi
  if (user.isBlocked) {
    return res.status(403).json({ error: "Hisobingiz bloklangan. Yordam uchun administratorga murojaat qiling." });
  }

  if (!existing) {
    await logActivity(user.id, "REGISTERED", "Ro'yxatdan o'tdi");
    if (referrer) {
      await logActivity(referrer.id, "REFERRAL_JOINED", `Taklif qilingan foydalanuvchi qo'shildi: ${user.name}`);
    }
    await notifyAllAdmins({
      type: "NEW_REGISTRATION",
      title: "Yangi ro'yxatdan o'tish",
      body: user.name,
      linkType: "user",
      linkId: user.id,
    });
  }

  // Foydalanuvchi hali ko'rmagan, o'ziga tegishli eng so'nggi broadcast
  // xabar — ilova ochilganda popup sifatida bir marta ko'rsatiladi.
  const pendingBroadcast = await prisma.broadcastMessage.findFirst({
    where: {
      id: { gt: user.lastSeenBroadcastId },
      targetUserIds: { has: user.id },
    },
    orderBy: { id: "desc" },
    select: { id: true, text: true },
  });

  const token = signToken(user);
  res.json({
    token,
    pendingBroadcast,
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
      referralCode: user.referralCode,
      age: user.age,
      dailyStudyMinutes: user.dailyStudyMinutes,
      registrationCompleted: Boolean(user.registrationCompletedAt),
    },
  });
}));

// POST /api/auth/broadcast-seen  { id }
// Foydalanuvchi popup'ni yopganda chaqiriladi — shu ID'gacha (shu bilan
// birga) bo'lgan barcha broadcastlar bu foydalanuvchi uchun "ko'rilgan"
// deb belgilanadi, ya'ni keyingi kirishda qayta ko'rsatilmaydi.
authRouter.post("/broadcast-seen", requireAuth, loadCurrentUser, asyncHandler(async (req, res) => {
  const id = Number(req.body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "id noto'g'ri" });
  }

  if (id > req.user.lastSeenBroadcastId) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastSeenBroadcastId: id },
    });
  }

  res.json({ ok: true });
}));
