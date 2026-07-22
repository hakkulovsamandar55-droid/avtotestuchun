import crypto from "node:crypto";

/**
 * Telegram Mini App yuboradigan `initData` ni tekshiradi.
 * Bu PAROL emas — Telegram o'zi bot tokeningiz bilan imzolab yuboradi,
 * biz shu imzoni qayta hisoblab solishtiramiz. Hech qanday tarmoq
 * so'rovi kerak emas, faqat bot tokeningiz kerak (.env dagi BOT_TOKEN).
 *
 * @param {string} initData - Telegram.WebApp.initData qiymati (frontend'dan keladi)
 * @param {string} botToken - BotFather bergan bot tokeni
 * @param {number} [maxAgeSeconds=86400] - initData qancha vaqt amal qiladi (default 24 soat)
 * @returns {{ ok: true, user: object } | { ok: false, reason: string }}
 */
export function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, reason: "initData yo'q" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    return { ok: false, reason: "hash topilmadi" };
  }
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false, reason: "imzo mos kelmadi (soxta so'rov bo'lishi mumkin)" };
  }

  const authDate = Number(params.get("auth_date"));
  if (authDate && Date.now() / 1000 - authDate > maxAgeSeconds) {
    return { ok: false, reason: "initData muddati o'tgan, qaytadan kiring" };
  }

  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (!user || !user.id) {
    return { ok: false, reason: "foydalanuvchi ma'lumoti yo'q" };
  }

  // Telegram referral havolasi orqali ochilgan bo'lsa (t.me/bot/app?startapp=KOD),
  // bu qiymat shu yerda keladi — ro'yxatdan o'tishda taklif qiluvchini aniqlash uchun.
  const startParam = params.get("start_param") || null;

  return { ok: true, user, startParam };
}
