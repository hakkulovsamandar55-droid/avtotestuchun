// Marshrut parametrlari va so'rov tanasini tekshirish uchun umumiy yordamchilar.
// Ilgari har joyda `Number(req.params.id)` ishlatilardi — agar id raqam bo'lmasa
// (masalan /api/admin/users/abc), NaN Prisma'ga uzatilib, foydalanuvchi
// tushunarsiz 500 "Server xatosi" olardi. Endi aniq 400 qaytadi.

/**
 * Marshrutdagi raqamli ID ni tekshiradi.
 * @returns {number|null} — yaroqli bo'lsa son, aks holda null
 */
export function parseId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/**
 * Express middleware: :id parametrini tekshirib, req.id ga yozadi.
 * Yaroqsiz bo'lsa so'rovni 400 bilan to'xtatadi.
 */
export function requireIdParam(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Noto'g'ri ID" });
  }
  req.id = id;
  next();
}

/**
 * Ro'yxatlar uchun sahifalash parametrlari. Cheklovsiz `take` DB'ni
 * ortiqcha yuklashi mumkin, shuning uchun yuqori chegara majburiy.
 */
export function parsePagination(query, { defaultLimit = 50, maxLimit = 100 } = {}) {
  const limitRaw = Number(query.limit);
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, maxLimit) : defaultLimit;

  const offsetRaw = Number(query.offset);
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  return { limit, offset };
}
