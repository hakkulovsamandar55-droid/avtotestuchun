import { prisma } from "../db.js";
import {
  ACCESS,
  FEATURE_KEYS,
  SETTING_KEYS,
  defaultFeatureAccess,
} from "../../../shared/config/features.js";

// ============================================================================
// GLOBAL SOZLAMALAR XIZMATI
//
// KESHLASH: bu qiymatlar deyarli har bir so'rovda kerak bo'ladi (imkoniyat
// tekshiruvi), lekin juda kam o'zgaradi (admin qo'lda o'zgartirganda).
// Har safar bazaga borish ma'nosiz yuk bo'lardi, shuning uchun xotirada
// qisqa muddatli kesh saqlanadi.
//
// KESH MUDDATI qisqa (30s) — admin o'zgartirgandan keyin ta'sir tez
// ko'rinishi kerak. Bundan tashqari, yozish amali keshni darhol tozalaydi,
// shuning uchun O'SHA server nusxasida o'zgarish bir zumda ko'rinadi.
// Bir nechta nusxa (instance) ishlayotgan bo'lsa, boshqalarida 30
// soniyagacha kechikishi mumkin — bu sozlama uchun maqbul.
// ============================================================================

const CACHE_TTL_MS = 30 * 1000;
let cache = null;
let cacheAt = 0;

function invalidateCache() {
  cache = null;
  cacheAt = 0;
}

/** Barcha sozlamalarni o'qiydi (keshdan yoki bazadan). */
export async function getSettings() {
  if (cache && Date.now() - cacheAt < CACHE_TTL_MS) return cache;

  let rows = [];
  try {
    rows = await prisma.appSetting.findMany();
  } catch (err) {
    // Jadval hali yaratilmagan bo'lishi mumkin (migratsiya ishlatilmagan).
    // Bu holatda ilova ISHLASHDA DAVOM ETISHI kerak — sozlamalar
    // boshlang'ich qiymatlarga tushadi, xato tashlanmaydi.
    rows = [];
  }

  const raw = {};
  for (const r of rows) raw[r.key] = r.value;

  const globalFreeMode = raw[SETTING_KEYS.GLOBAL_FREE_MODE] === "true";

  let featureAccess = defaultFeatureAccess();
  if (raw[SETTING_KEYS.FEATURE_ACCESS]) {
    try {
      const parsed = JSON.parse(raw[SETTING_KEYS.FEATURE_ACCESS]);
      // Faqat TANISH kalitlarni qabul qilamiz. Sabab: eski/noto'g'ri
      // kalit qolib ketsa yoki qiymat buzilgan bo'lsa, u jimgina
      // e'tiborsiz qoldiriladi va boshlang'ich qiymat ishlaydi.
      for (const key of FEATURE_KEYS) {
        if (parsed[key] === ACCESS.FREE || parsed[key] === ACCESS.PREMIUM) {
          featureAccess[key] = parsed[key];
        }
      }
    } catch (err) {
      // Buzilgan JSON — boshlang'ich qiymatlar bilan davom etamiz
    }
  }

  cache = {
    globalFreeMode,
    featureAccess,
    supportLink: raw[SETTING_KEYS.SUPPORT_LINK] || null,
    botUsername: raw[SETTING_KEYS.BOT_USERNAME] || process.env.BOT_USERNAME || null,
  };
  cacheAt = Date.now();
  return cache;
}

/** Bitta sozlamani yozadi (admin panelidan). */
export async function setSetting(key, value, adminId = null) {
  const str = value == null ? "" : String(value);
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: str, updatedById: adminId },
    update: { value: str, updatedById: adminId },
  });
  invalidateCache();
  return { key, value: str };
}

/**
 * Foydalanuvchi uchun imkoniyat ochiqmi.
 *
 * Tartib MUHIM:
 *   1) Global bepul rejim yoqilgan bo'lsa — hamma narsa ochiq
 *   2) Imkoniyat FREE deb belgilangan bo'lsa — ochiq
 *   3) Aks holda — faqat premium foydalanuvchiga
 */
export async function isFeatureAvailable(user, featureKey) {
  const s = await getSettings();
  if (s.globalFreeMode) return true;
  if (s.featureAccess[featureKey] === ACCESS.FREE) return true;
  return Boolean(user?.isPremium);
}

/** Frontend uchun ochiq sozlamalar (maxfiy narsa yo'q). */
export async function getPublicSettings() {
  const s = await getSettings();
  return {
    globalFreeMode: s.globalFreeMode,
    featureAccess: s.featureAccess,
    supportLink: s.supportLink,
  };
}

export { invalidateCache };
