// ============================================================================
// YAGONA MANBA — Premium tariflar
//
// Ilgari narxlar UCH joyda saqlanardi:
//   1) src/data/premiumData.js  — foydalanuvchi ko'radigan narx
//   2) backend/src/data/premiumPlans.js — to'lov tekshiruvi uchun narx
//   3) admin panelda o'zgartirilgan narx — brauzer localStorage'ida
//
// Bu jiddiy muammo edi: admin narxni panel orqali o'zgartirsa, u faqat
// O'ZINING brauzerida o'zgarardi. Boshqa foydalanuvchilar eski narxni
// ko'rardi, backend esa uchinchi narx bo'yicha OCR tekshiruvi qilardi —
// natijada to'g'ri to'lagan foydalanuvchining cheki "summa mos emas"
// ogohlantirishini olardi.
//
// Endi narx faqat shu yerda. Kelajakda admin panel orqali o'zgartirish
// kerak bo'lsa, DB'da PremiumPlan jadvali yaratilib, bu qiymatlar
// boshlang'ich (seed) sifatida ishlatiladi.
// ============================================================================

export const PREMIUM_PLANS = [
  {
    key: "lite",
    name: "Lite",
    price: 19000,
    period: "oy",
    durationDays: 30,
    badge: "",
    features: [
      "Barcha 61 ta bilet — cheklovsiz",
      "Kunlik 1 marta imtihon rejimi",
      "Reklamasiz interfeys",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 39000,
    period: "oy",
    durationDays: 30,
    badge: "Eng ommabop",
    features: [
      "Lite tarifidagi barcha imkoniyatlar",
      "Cheklovsiz imtihon rejimi",
      "AI xato tahlili va shaxsiy tavsiyalar",
      "Statistika va progress grafiklari",
    ],
  },
  {
    key: "vip",
    name: "VIP",
    price: 69000,
    period: "oy",
    durationDays: 30,
    badge: "Maksimal natija",
    features: [
      "Pro tarifidagi barcha imkoniyatlar",
      "Shaxsiy instruktor bilan onlayn maslahat",
      "Imtihonga tayyorgarlik kafolati",
      "Yangi savollarga birinchi bo'lib kirish",
    ],
  },
];

export const PLAN_KEYS = PREMIUM_PLANS.map((p) => p.key);

export function findPlan(key) {
  return PREMIUM_PLANS.find((p) => p.key === key) || null;
}

// Narx endi son sifatida saqlanadi (ilgari "19 000" satr edi va har safar
// `replace(/\D/g, "")` bilan tozalanardi — bu xatoga moyil usul).
// Ko'rsatish uchun formatlash shu yerda, bitta joyda.
export function formatPrice(amount) {
  return new Intl.NumberFormat("uz-UZ").format(amount);
}
