import sharp from "sharp";
import crypto from "crypto";
import fs from "fs/promises";
import { createWorker } from "tesseract.js";

// ============================================================================
// MUHIM ARXITEKTURA QARORI:
//
// Bu xizmat to'lov chekini HECH QACHON avtomatik tasdiqlamaydi yoki rad
// etmaydi. OCR + qoidalar faqat:
//   1) Chekdan matn/raqamlarni ajratib olib, adminga tayyor holda ko'rsatadi
//      (admin har bir chekni qo'lda o'qib o'tirmasin, tezroq qaror qilsin)
//   2) Shubhali holatlarni "ogohlantirish" sifatida belgilaydi (masalan
//      summa mos kelmasa, sana eski bo'lsa) — bular navbatni tartiblash
//      uchun ishlatiladi, avtomatik rad etish uchun EMAS.
//
// Chunki: chekdagi matnni har kim tahrirlab, kerakli raqam/so'zlarni yozib
// qo'yishi mumkin — bu pul haqiqatan o'tganini HECH QACHON isbotlamaydi.
// Faqat admin (kerak bo'lsa bank hisobotiga qarab) yakuniy qaror qiladi.
// Status har doim PENDING bo'lib qoladi, admin Approve/Reject bosgunicha.
// ============================================================================

// Ma'muriyat kartalari — .env dan, vergul bilan ajratilgan (masalan "8600 1234 5678 9012,9860 ...")
function getAdminCards() {
  return (process.env.ADMIN_CARD_NUMBERS || "")
    .split(",")
    .map((c) => c.replace(/\D/g, ""))
    .filter(Boolean);
}

// To'lov muvaffaqiyatli o'tganini bildiruvchi kalit so'zlar (o'zbek/rus bank ilovalari uchun keng tarqalgan)
const SUCCESS_KEYWORDS = [
  "muvaffaqiyatli", "bajarildi", "успешно", "выполнен", "to'lov",
  "перевод", "otkazma", "o'tkazma", "chek", "чек", "quittance",
  "payme", "click", "uzcard", "humo",
];

let workerPromise = null;
// tesseract.js worker'ini yaratish sekin (til ma'lumotlarini yuklaydi) —
// shuning uchun bitta worker'ni butun process davomida qayta ishlatamiz.
async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(["uzb", "rus", "eng"]).catch((err) => {
      // Agar uzb/rus til paketi mavjud bo'lmasa, inglizchaga tushamiz —
      // OCR sifat pasayadi, lekin xizmat butunlay to'xtab qolmaydi.
      console.error("OCR worker (uzb+rus) ochilmadi, eng bilan urinib ko'ramiz:", err.message);
      return createWorker(["eng"]);
    });
  }
  return workerPromise;
}

// Rasmni OCR uchun tayyorlaydi: kontrastni oshiradi, oq-qora qiladi, o'lchamini normallashtiradi.
// Telefon kamerasida olingan cheklar ko'pincha xira/noaniq bo'ladi — bu OCR aniqligini sezilarli oshiradi.
async function preprocessImage(filePath) {
  const buffer = await sharp(filePath)
    .rotate() // EXIF orientatsiyasini avtomatik to'g'irlaydi
    .resize({ width: 1400, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .toFormat("png")
    .toBuffer();
  return buffer;
}

// Rasm sifati (blur/aniqlik) taxminiy baholanadi — juda past bo'lsa
// ogohlantirish beriladi ("iltimos aniqroq rasm yuboring").
async function estimateImageQuality(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const minDimension = Math.min(metadata.width || 0, metadata.height || 0);
    if (minDimension < 400) return { ok: false, reason: "past_sifat" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "rasm_oqilmadi" };
  }
}

// Chekning takroran yuklanishini aniqlash uchun barqaror hash.
// Rasmni kichik, normallashtirilgan shaklga keltirib hash olamiz — shunda
// bir xil chekning biroz siqilgan/qayta saqlangan nusxasi ham aniqlanadi.
export async function computeReceiptHash(filePath) {
  const normalized = await sharp(filePath)
    .resize(64, 64, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function extractAmount(text) {
  // "150 000", "150,000", "150000 so'm" kabi formatlarni qidiradi
  const matches = text.match(/(\d[\d\s.,]{3,})\s*(so'm|сум|som|uzs)?/gi);
  if (!matches) return null;
  const numbers = matches
    .map((m) => Number(m.replace(/[^\d]/g, "")))
    .filter((n) => n >= 1000 && n <= 100_000_000);
  if (numbers.length === 0) return null;
  // Odatda eng katta topilgan raqam — to'lov summasi (chekda sana/vaqt ham raqam bo'lishi mumkin)
  return Math.max(...numbers);
}

function extractCardNumber(text) {
  const match = text.match(/\b(\d{4}[\s*]?\d{2,4}[\s*]?\*{0,4}[\s*]?\d{0,4}[\s*]?\d{4})\b/);
  if (!match) return null;
  return match[0].replace(/\s/g, "");
}

function extractDate(text) {
  // dd.mm.yyyy yoki dd/mm/yyyy
  const match = text.match(/\b(\d{2})[.\/](\d{2})[.\/](\d{4})\b/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(date.getTime()) ? null : date;
}

function cardsMatch(extractedCard, adminCards) {
  if (!extractedCard) return false;
  const digitsOnly = extractedCard.replace(/\D/g, "");
  return adminCards.some((admin) => {
    // To'liq mos kelishi shart emas — chekda ko'pincha karta qisman
    // yashiringan (masalan 8600****1234), shuning uchun oxirgi 4 va
    // birinchi 4 raqam moslashini tekshiramiz.
    if (digitsOnly.length < 4 || admin.length < 4) return false;
    const lastMatch = digitsOnly.slice(-4) === admin.slice(-4);
    const firstMatch = digitsOnly.slice(0, 4) === admin.slice(0, 4);
    return lastMatch && (firstMatch || digitsOnly.length < 8);
  });
}

/**
 * Chekni tahlil qiladi: OCR + qoidaga asoslangan ogohlantirishlar.
 * HECH QACHON avtomatik approve/reject qilmaydi — natija admin uchun tayyorlanadi.
 *
 * @returns {{
 *   extractedText: string, extractedAmount: number|null, extractedCard: string|null,
 *   extractedDate: Date|null, warnings: string[], confidence: number
 * }}
 */
export async function analyzeReceipt(filePath, { expectedAmount } = {}) {
  const warnings = [];

  const quality = await estimateImageQuality(filePath);
  if (!quality.ok) {
    warnings.push("past_sifat");
  }

  let extractedText = "";
  try {
    const processed = await preprocessImage(filePath);
    const worker = await getWorker();
    const { data } = await worker.recognize(processed);
    extractedText = data.text || "";
  } catch (err) {
    console.error("OCR xatosi:", err);
    warnings.push("ocr_muvaffaqiyatsiz");
  }

  const extractedAmount = extractAmount(extractedText);
  const extractedCard = extractCardNumber(extractedText);
  const extractedDate = extractDate(extractedText);

  if (!extractedText.trim()) {
    warnings.push("matn_topilmadi");
  }

  const adminCards = getAdminCards();
  if (adminCards.length > 0 && !cardsMatch(extractedCard, adminCards)) {
    warnings.push("karta_mos_emas");
  }

  if (expectedAmount != null && extractedAmount != null && extractedAmount !== expectedAmount) {
    warnings.push("summa_mos_emas");
  }
  if (expectedAmount != null && extractedAmount == null) {
    warnings.push("summa_topilmadi");
  }

  const hasSuccessKeyword = SUCCESS_KEYWORDS.some((kw) =>
    extractedText.toLowerCase().includes(kw.toLowerCase())
  );
  if (!hasSuccessKeyword) {
    warnings.push("kalit_soz_topilmadi");
  }

  if (extractedDate) {
    const daysDiff = (Date.now() - extractedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 3) {
      warnings.push("sana_eski");
    }
  } else {
    warnings.push("sana_topilmadi");
  }

  // Ishonch darajasi — sof tartiblash ko'rsatkichi (0 ogohlantirish = 100,
  // har biri -15). Bu HECH QANDAY qarorni o'zi qabul qilmaydi, faqat admin
  // navbatida qaysi cheklar tezroq ko'rib chiqilishi kerakligini bildiradi.
  const confidence = Math.max(0, 100 - warnings.length * 15);

  return { extractedText, extractedAmount, extractedCard, extractedDate, warnings, confidence };
}

export async function cleanupWorker() {
  if (workerPromise) {
    const worker = await workerPromise;
    await worker.terminate();
    workerPromise = null;
  }
}
