// Premium tariflar — narxlar shared/data/premiumPlans.js da (yagona manba).
//
// Ilgari bu yerda narxlarning alohida nusxasi turardi va admin panelda
// o'zgartirilgan qiymat localStorage'ga yozilardi. Bu jiddiy muammo edi:
// localStorage faqat BITTA brauzerda ishlaydi, ya'ni admin narxni
// o'zgartirsa, boshqa foydalanuvchilar eski narxni ko'rardi, backend esa
// uchinchi narx bo'yicha to'lovni tekshirardi.
//
// localStorage'ga yozish olib tashlandi. Narxni o'zgartirish kerak bo'lsa,
// shared/data/premiumPlans.js tahrirlanadi (kelajakda — DB orqali).

import { PREMIUM_PLANS, findPlan, formatPrice } from "../../shared/data/premiumPlans.js";

export { PREMIUM_PLANS, findPlan, formatPrice };

// Orqaga moslik uchun eski nom
export const DEFAULT_PREMIUM_PLANS = PREMIUM_PLANS;

export function loadPremiumPlans() {
  return PREMIUM_PLANS;
}
