import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, telegramId: user.telegramId.toString(), role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// So'rovni kim yuborayotganini token orqali aniqlaydi
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Token yo'q" });
  }
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token yaroqsiz yoki muddati o'tgan" });
  }
}

// ESKIRGAN — tokendagi rolga tayanadi, ya'ni admin huquqi olib tashlangandan
// keyin ham eski token bilan 30 kun davomida o'tib ketaverardi.
// Buning o'rniga services/userState.js dagi loadCurrentUser + requireAdminUser
// ishlatiladi (DB'dagi joriy rolni tekshiradi).
// Faqat orqaga moslik uchun qoldirilgan — yangi kodda ishlatilmasin.
export function requireAdmin(req, res, next) {
  if (req.auth?.role !== "ADMIN") {
    return res.status(403).json({ error: "Bu bo'lim faqat adminlar uchun" });
  }
  next();
}
