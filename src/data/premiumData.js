// Premium tariflar — standart (default) qiymatlar.
// Admin panelda o'zgartirilgan qiymatlar brauzerda saqlanadi va shu standartlarni bosib o'tadi.
// (Backendga ulanganda bu yerni /api/premium/plans so'roviga almashtirish kifoya — struktura bir xil qoladi.)

export const STORAGE_KEY = "tezprava_premium_plans";

export const DEFAULT_PREMIUM_PLANS = [
  {
    key: "lite",
    name: "Lite",
    price: "19 000",
    period: "oy",
    badge: "",
    features: [
      "Barcha 60 ta bilet — cheklovsiz",
      "Kunlik 1 marta imtihon rejimi",
      "Reklamasiz interfeys",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "39 000",
    period: "oy",
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
    price: "69 000",
    period: "oy",
    badge: "Maksimal natija",
    features: [
      "Pro tarifidagi barcha imkoniyatlar",
      "Shaxsiy instruktor bilan onlayn maslahat",
      "Imtihonga tayyorgarlik kafolati",
      "Yangi savollarga birinchi bo'lib kirish",
    ],
  },
];

export function loadPremiumPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREMIUM_PLANS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 3) return DEFAULT_PREMIUM_PLANS;
    return parsed;
  } catch {
    return DEFAULT_PREMIUM_PLANS;
  }
}

export function savePremiumPlans(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}
