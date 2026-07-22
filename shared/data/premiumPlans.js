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

// ============================================================================
// YAGONA MANBA — Premium tariflar
//
// MUHIM: bu yerda uchta ALOHIDA mahsulot (Lite/Pro/VIP) emas, BITTA "Pro"
// imkoniyatlar to'plami — faqat MUDDATI farq qiladi (15 kun / 30 kun / 3 oy).
// Uzoqroq muddat tanlash foydalanuvchiga kunlik hisobda arzonroq tushadi
// (odatiy obuna amaliyoti), lekin imkoniyatlar hammasida bir xil.
//
// Ilgari narxlar UCH joyda saqlanardi (frontend/backend/admin localStorage)
// va bir-biridan farq qilib qolishi mumkin edi. Endi narx faqat shu yerda.
// ============================================================================

export const PREMIUM_PLANS = [
  {
    key: "days15",
    name: "15 kunlik",
    price: 15000,
    period: "15 kun",
    durationDays: 15,
    badge: "",
    features: [
      "Barcha 61 ta bilet — cheklovsiz",
      "Cheklovsiz rasmiy imtihon",
      "AI xato tahlili va shaxsiy tavsiyalar",
      "Statistika va progress grafiklari",
    ],
  },
  {
    key: "days30",
    name: "30 kunlik",
    price: 25000,
    period: "30 kun",
    durationDays: 30,
    badge: "Eng ommabop",
    features: [
      "Barcha 61 ta bilet — cheklovsiz",
      "Cheklovsiz rasmiy imtihon",
      "AI xato tahlili va shaxsiy tavsiyalar",
      "Statistika va progress grafiklari",
    ],
  },
  {
    key: "days90",
    name: "3 oylik",
    price: 60000,
    period: "3 oy",
    durationDays: 90,
    badge: "Eng foydali",
    features: [
      "Barcha 61 ta bilet — cheklovsiz",
      "Cheklovsiz rasmiy imtihon",
      "AI xato tahlili va shaxsiy tavsiyalar",
      "Statistika va progress grafiklari",
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
