import { prisma } from "../db.js";
import crypto from "crypto";

// Har bir foydalanuvchi uchun qisqa, o'qish oson referral kod (masalan "A3F9K2").
// To'qnashuv ehtimoli juda past, lekin baribir tekshiramiz — bir necha marta
// urinib ko'ramiz (amalda deyarli hech qachon 2-urinishga yetmaydi).
export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  // Juda kam ehtimolli holat — vaqt tamg'asi bilan kafolatlangan noyoblik
  return `R${Date.now().toString(36).toUpperCase()}`;
}

// Ro'yxatdan o'tish paytida referral kodni topib, taklif qiluvchiga bog'laydi.
// O'zini-o'zi taklif qilish yoki mavjud bo'lmagan kod jimgina e'tiborsiz qoldiriladi
// (ro'yxatdan o'tishni bloklamaydi).
export async function resolveReferrer(refCode, newUserTelegramId) {
  if (!refCode) return null;
  const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } });
  if (!referrer) return null;
  if (referrer.telegramId === newUserTelegramId) return null;
  return referrer;
}
