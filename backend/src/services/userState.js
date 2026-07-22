import { prisma } from "../db.js";
import { logActivity } from "./activity.js";

// ============================================================================
// NIMA UCHUN BU FAYL KERAK
//
// Ilgari rol va premium holati FAQAT JWT ichida saqlanardi. Token 30 kun amal
// qilgani uchun quyidagi jiddiy muammolar bor edi:
//
//   1) Admin foydalanuvchini BLOKLAGANDA — u baribir ilovadan foydalanishda
//      davom etardi, chunki bloklash faqat login paytida tekshirilardi.
//   2) Admin rolini OLIB TASHLAGANDA — eski tokendagi role: "ADMIN" tufayli
//      u 30 kun davomida admin panelga kira olardi. Bu xavfsizlik teshigi.
//   3) Premium MUDDATI TUGAGANDA — premiumExpiresAt o'tib ketsa ham,
//      isPremium: true bo'lib qolardi. Hech qanday joyda muddat tekshirilmasdi,
//      ya'ni bir marta to'lagan odam abadiy premium bo'lib qolardi.
//
// Endi har bir himoyalangan so'rovda foydalanuvchining HAQIQIY holati DB'dan
// o'qiladi. Bu qo'shimcha bitta indekslangan so'rov (primary key bo'yicha) —
// arzon, lekin xavfsizlik uchun majburiy.
// ============================================================================

// Premium muddati tugagan bo'lsa, DB'ni tozalab, yangilangan foydalanuvchini
// qaytaradi. Bu "lazy expiry" — alohida cron kerak emas, foydalanuvchi keyingi
// so'rov yuborganda o'zi hal bo'ladi.
async function expirePremiumIfNeeded(user) {
  const isExpired =
    user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt <= new Date();

  if (!isExpired) return user;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isPremium: false, premiumPlan: null },
  });

  await logActivity(
    user.id,
    "PREMIUM_EXPIRED",
    `${user.premiumPlan || "Premium"} tarifi muddati tugadi`
  );

  return updated;
}

// lastOnlineAt ni har bir so'rovda yozish DB'ga ortiqcha yuk beradi
// (bitta foydalanuvchi bir daqiqada o'nlab so'rov yuborishi mumkin).
// Shuning uchun faqat 5 daqiqada bir marta yangilaymiz — "oxirgi faollik"
// ko'rsatkichi uchun bu aniqlik yetarli.
const ONLINE_WRITE_INTERVAL_MS = 5 * 60 * 1000;

function shouldRefreshOnline(lastOnlineAt) {
  if (!lastOnlineAt) return true;
  return Date.now() - lastOnlineAt.getTime() > ONLINE_WRITE_INTERVAL_MS;
}

/**
 * requireAuth dan keyin ishlaydi. Tokendagi eskirgan ma'lumot o'rniga
 * DB'dagi haqiqiy holatni req.user ga yozadi va bloklangan foydalanuvchini
 * to'xtatadi.
 */
export async function loadCurrentUser(req, res, next) {
  try {
    let user = await prisma.user.findUnique({ where: { id: req.auth.sub } });

    if (!user) {
      // Hisob o'chirilgan, lekin tokeni hali amal qilyapti
      return res.status(401).json({ error: "Hisob topilmadi" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Hisobingiz bloklangan. Yordam uchun administratorga murojaat qiling.",
      });
    }

    user = await expirePremiumIfNeeded(user);

    if (shouldRefreshOnline(user.lastOnlineAt)) {
      // Faollik yozuvi so'rovni sekinlashtirmasligi kerak — natijasini kutmaymiz,
      // lekin xatosini yutib yuboramiz (aks holda unhandledRejection bo'ladi).
      prisma.user
        .update({ where: { id: user.id }, data: { lastOnlineAt: new Date() } })
        .catch((err) => console.error("lastOnlineAt yangilanmadi:", err));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Admin huquqini TOKEN emas, DB'dagi joriy rol bo'yicha tekshiradi.
 * loadCurrentUser dan keyin ishlatiladi.
 */
export function requireAdminUser(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Bu bo'lim faqat adminlar uchun" });
  }
  next();
}
