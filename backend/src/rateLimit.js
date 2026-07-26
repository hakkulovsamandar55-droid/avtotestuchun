// ============================================================================
// SODDA RATE LIMITING — spam va brute-force himoyasi
//
// NIMA UCHUN TASHQI KUTUBXONA EMAS: express-rate-limit kabi paketlar
// ko'proq imkoniyat beradi, lekin bizga faqat oddiy "N ta so'rov / M
// daqiqada" kerak. Qo'shimcha bog'liqlik va uning yangilanishlarini
// kuzatish ortiqcha.
//
// NIMA UCHUN XOTIRADA (Redis emas): ilova bitta process'da ishlaydi
// (Render bepul tarifi, WEB_CONCURRENCY=1). Bir necha process bo'lsa
// har biri o'z hisobini yuritadi — bu holda chegara samarasiz bo'lardi
// va Redis kerak bo'lardi. Hozircha shart emas.
//
// CHEKLOV: server qayta ishga tushganda hisoblar nolga qaytadi. Bu
// qabul qilinadi — maqsad avtomatik spam'ni to'sish, mukammal himoya emas.
// ============================================================================

// Kalit -> { count, resetAt }
const buckets = new Map();

// Xotira cheksiz o'smasligi uchun davriy tozalash.
// Aks holda har yangi foydalanuvchi yangi kalit qo'shib, xotira asta
// to'lib borardi (memory leak).
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS).unref?.(); // unref: test tugaganda process to'xtashiga xalaqit bermaydi

/**
 * Rate limit middleware yaratadi.
 *
 * @param {object} opts
 * @param {number} opts.max        Ruxsat etilgan so'rov soni
 * @param {number} opts.windowMs   Vaqt oynasi (millisekund)
 * @param {string} opts.name       Kalit prefiksi (turli endpointlar aralashmasligi uchun)
 * @param {string} [opts.message]  Foydalanuvchiga ko'rsatiladigan xabar
 */
export function rateLimit({ max, windowMs, name, message }) {
  return function limiter(req, res, next) {
    // Foydalanuvchi ID bo'yicha cheklaymiz, IP emas.
    //
    // NIMA UCHUN: Telegram Mini App'da ko'p foydalanuvchi bir xil IP
    // ortida bo'lishi mumkin (mobil operator NAT). IP bo'yicha cheklasak,
    // bir odam boshqalarni ham bloklab qo'yardi.
    //
    // Autentifikatsiyadan OLDIN ishlatilmasligi kerak — req.user kerak.
    const userId = req.user?.id;
    if (!userId) return next(); // auth middleware o'zi rad etadi

    const key = `${name}:${userId}`;
    const now = Date.now();
    let b = buckets.get(key);

    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }

    b.count += 1;

    if (b.count > max) {
      const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: "rate_limited",
        message: message || "Juda ko'p so'rov yuborildi. Bir oz kutib qayta urinib ko'ring.",
        retryAfterSec,
      });
    }

    return next();
  };
}

/** Testlar uchun: hisoblarni tozalash */
export function resetRateLimits() {
  buckets.clear();
}
