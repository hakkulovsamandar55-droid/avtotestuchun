// Frontend/src/data/premiumData.js dagi DEFAULT_PREMIUM_PLANS bilan struktura va
// qiymatlar mos bo'lishi kerak — bu yerda narx serverga tegishli tekshiruvlar
// (to'lov summasi, OCR solishtirish) uchun ishlatiladi.
//
// ESLATMA: agar admin panel orqali tarif narxlari o'zgartirilsa (hozircha frontendda
// localStorage'da saqlanadi), bu faylni ham moslashtirish kerak, aks holda
// backend eski narx bo'yicha tekshiradi. Kelajakda buni bitta manbaga
// (masalan DB'dagi PremiumPlan jadvaliga) ko'chirish tavsiya etiladi.
export const DEFAULT_PREMIUM_PLANS = [
  { key: "lite", name: "Lite", price: "19 000", period: "oy" },
  { key: "pro", name: "Pro", price: "39 000", period: "oy" },
  { key: "vip", name: "VIP", price: "69 000", period: "oy" },
];
