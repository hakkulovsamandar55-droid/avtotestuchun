import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Barcha yuklangan fayllar (chat rasmlar, to'lov cheklari) shu papkaga tushadi.
// index.js buni /uploads orqali statik xizmat qiladi.
export const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 8) || ".jpg";
    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, name);
  },
});

function imageFileFilter(_req, file, cb) {
  if (!file.mimetype?.startsWith("image/")) {
    return cb(new Error("Faqat rasm fayllari qabul qilinadi"));
  }
  cb(null, true);
}

// Chat screenshot yoki to'lov cheki — 8MB yetarli, undan kattasi odatda xato yuklash
export const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

export function publicUrlFor(filename) {
  return `/uploads/${filename}`;
}
