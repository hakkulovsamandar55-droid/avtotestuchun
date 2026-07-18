import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";

for (const key of ["BOT_TOKEN", "JWT_SECRET", "DATABASE_URL"]) {
  if (!process.env[key]) {
    console.error(`.env da ${key} yo'q — server ishga tushmaydi.`);
    process.exit(1);
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

// Umumiy xatolarni ushlash — parolsiz stack-trace'ni foydalanuvchiga chiqarmaslik uchun
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server xatosi" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend ${PORT}-portda ishlayapti`));
