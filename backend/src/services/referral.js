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
//
// MUHIM TUZATISH: havoladagi start_param "ref_KOD" ko'rinishida keladi
// (masalan "ref_A3F9K2"), lekin bazada faqat "A3F9K2" saqlanadi. Bu
// prefiks ilgari olib tashlanmasdi — natijada referralCode qidiruvi
// HECH QACHON topilmasdi va referrer doim null qaytardi, hatto havola
// to'g'ri ochilgan taqdirda ham.
export async function resolveReferrer(refCode, newUserTelegramId) {
  if (!refCode) return null;
  const code = refCode.startsWith("ref_") ? refCode.slice(4) : refCode;
  if (!code) return null;
  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  if (!referrer) return null;
  if (referrer.telegramId === newUserTelegramId) return null;
  return referrer;
}
