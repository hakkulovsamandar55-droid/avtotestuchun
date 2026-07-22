import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { statsRouter } from "./routes/stats.js";
import { supportRouter, adminSupport } from "./routes/support.js";
import { paymentsRouter, adminPayments } from "./routes/payments.js";
import { notificationsRouter } from "./routes/notifications.js";
import { examRouter } from "./routes/exam.js";
import { initDuelSocket } from "./duel.js";
import { UPLOADS_DIR } from "./lib/upload.js";

for (const key of ["BOT_TOKEN", "JWT_SECRET", "DATABASE_URL"]) {
  if (!process.env[key]) {
    console.error(`.env da ${key} yo'q — server ishga tushmaydi.`);
    process.exit(1);
  }
}

// Xavfsizlik chorasi: kutilmagan (masalan DB) xatolar butun serverni
// qulatib qo'ymasin — buning o'rniga faqat logga yoziladi. Aks holda bitta
// route'dagi ushlanmagan xato butun ilovani (shu jumladan Duel socket'ni)
// to'xtatib qo'yishi mumkin edi.
process.on("unhandledRejection", (reason) => {
  console.error("Ushlanmagan promise xatosi:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Ushlanmagan xato:", err);
});

const app = express();

// CORS — oldin `cors()` hech qanday cheklovsiz ishlatilgan edi, ya'ni istalgan
// sayt foydalanuvchi brauzeri orqali API'ga so'rov yubora olardi. Endi faqat
// .env dagi CORS_ORIGINS ro'yxatidagi manzillar (vergul bilan) ruxsat etiladi.
// Ro'yxat bo'sh bo'lsa — faqat lokal ishlab chiqish manzillari.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isOriginAllowed(origin) {
  // origin yo'q = bir xil manbadan yoki server-to-server (curl, mobil ilova) —
  // brauzer CORS'i bunday so'rovlarga taalluqli emas, shuning uchun ruxsat.
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

app.use(
  cors({
    origin: (origin, cb) =>
      isOriginAllowed(origin) ? cb(null, true) : cb(new Error("CORS: ruxsat etilmagan manba")),
    credentials: true,
  })
);

// JSON body hajmini cheklaymiz — cheksiz katta payload yuborib xotirani
// to'ldirish (DoS) imkoniyatini yopadi.
app.use(express.json({ limit: "256kb" }));

// Yuklangan rasmlar (chat screenshotlar, to'lov cheklari) shu orqali ochiladi
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/support", adminSupport);
app.use("/api/admin/payments", adminPayments);
app.use("/api/admin/notifications", notificationsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/support", supportRouter);
app.use("/api/payments", paymentsRouter);
// Rasmiy imtihon (Official Exam) — mashq imtihonidan alohida modul
app.use("/api/exam", examRouter);

// Umumiy xatolarni ushlash — parolsiz stack-trace'ni foydalanuvchiga chiqarmaslik uchun.
// Ba'zi xatolar aslida foydalanuvchi xatosi (juda katta fayl, noto'g'ri format,
// ruxsat etilmagan manba) — ular 500 emas, aniq status va tushunarli matn olishi kerak,
// aks holda foydalanuvchi nima noto'g'ri ekanini bilmaydi.
app.use((err, _req, res, _next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Fayl hajmi juda katta (maksimum 8MB)" });
  }
  if (err?.code?.startsWith?.("LIMIT_")) {
    return res.status(400).json({ error: "Fayl yuklashda xato" });
  }
  if (err?.message === "Faqat rasm fayllari qabul qilinadi") {
    return res.status(400).json({ error: err.message });
  }
  if (err?.message?.startsWith("CORS:")) {
    return res.status(403).json({ error: "Ruxsat etilmagan manba" });
  }

  console.error(err);
  res.status(500).json({ error: "Server xatosi" });
});

// Duel (jonli musobaqa) rejimi uchun Socket.io xuddi shu HTTP server ustida ishlaydi
const httpServer = createServer(app);
initDuelSocket(httpServer, { isOriginAllowed });

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Backend ${PORT}-portda ishlayapti (HTTP + duel socket)`));
