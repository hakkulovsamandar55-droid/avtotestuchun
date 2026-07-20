import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { statsRouter } from "./routes/stats.js";
import { notificationsRouter } from "./routes/notifications.js";
import { initDuelSocket } from "./duel.js";

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
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stats", statsRouter);
app.use("/api/notifications", notificationsRouter);

// Umumiy xatolarni ushlash — parolsiz stack-trace'ni foydalanuvchiga chiqarmaslik uchun
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server xatosi" });
});

// Duel (jonli musobaqa) rejimi uchun Socket.io xuddi shu HTTP server ustida ishlaydi
const httpServer = createServer(app);
initDuelSocket(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Backend ${PORT}-portda ishlayapti (HTTP + duel socket)`));
