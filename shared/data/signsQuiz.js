// ============================================================================
// YO'L BELGILARI TESTI — savol generatori
//
// Bu fayl shared/ da, chunki kelajakda backend ham shu mantiqni ishlatishi
// mumkin (natijani saqlash, duel rejimi). Hozircha faqat frontend chaqiradi.
// ============================================================================

import { SIGNS, getSignsByCategory } from "./signsData.js";

export const QUIZ_LENGTH_DEFAULT = 15;
const OPTIONS_PER_QUESTION = 4;

/**
 * MUHIM MUAMMO VA UNING YECHIMI
 *
 * Belgilar bazasida KO'P BELGI BIR XIL NOMGA EGA. Masalan 1.4.1 dan 1.4.6
 * gacha oltita belgining nomi aynan bir xil: "Temir yo'l kesishmasining
 * yaqinligi haqida ogohlantirish". Ular faqat chiziqlar soni bilan farq
 * qiladi.
 *
 * Agar chalg'ituvchi variantlar nom bo'yicha filtrlanmasa, quyidagi savol
 * paydo bo'ladi:
 *
 *   [1.4.2 rasmi]  "Bu belgi nimani bildiradi?"
 *     A) Temir yo'l kesishmasining yaqinligi haqida ogohlantirish
 *     B) Temir yo'l kesishmasining yaqinligi haqida ogohlantirish
 *     C) ...
 *
 * Bu savolga TO'G'RI javob berish imkonsiz — ikkita variant ham to'g'ri.
 * Shuning uchun chalg'ituvchilar NOM bo'yicha unikal bo'lishi shart.
 */
function pickDistractors(correctSign, pool, count) {
  const usedNames = new Set([normalizeName(correctSign.name)]);
  const out = [];

  for (const candidate of shuffle(pool)) {
    if (out.length >= count) break;
    if (candidate.code === correctSign.code) continue;

    const key = normalizeName(candidate.name);
    if (usedNames.has(key)) continue; // bir xil nomli belgi — savolni buzadi

    usedNames.add(key);
    out.push(candidate);
  }

  return out;
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

/**
 * Bitta savol yaratadi.
 *
 * CHALG'ITUVCHILAR AYNAN SHU TOIFADAN olinadi. Nima uchun: agar uchburchak
 * ogohlantiruvchi belgi ko'rsatilib, qolgan variantlar ko'k doira bo'lsa,
 * foydalanuvchi MA'NONI bilmasa ham shakl bo'yicha to'g'ri topadi. Bu esa
 * o'rganishga emas, taxmin qilishga o'rgatadi.
 *
 * Bir toifada 4 tadan kam unikal nom bo'lsa (masalan "additional" toifasi
 * kichik), qolganini boshqa toifalardan to'ldiramiz — savolsiz qolmaslik
 * uchun.
 */
function buildQuestion(sign, kind) {
  const sameCategory = getSignsByCategory(sign.cat);
  let distractors = pickDistractors(sign, sameCategory, OPTIONS_PER_QUESTION - 1);

  if (distractors.length < OPTIONS_PER_QUESTION - 1) {
    const needed = OPTIONS_PER_QUESTION - 1 - distractors.length;
    const usedCodes = new Set([sign.code, ...distractors.map((d) => d.code)]);
    const usedNames = new Set([
      normalizeName(sign.name),
      ...distractors.map((d) => normalizeName(d.name)),
    ]);
    const extra = [];
    for (const candidate of shuffle(SIGNS)) {
      if (extra.length >= needed) break;
      if (usedCodes.has(candidate.code)) continue;
      const key = normalizeName(candidate.name);
      if (usedNames.has(key)) continue;
      usedNames.add(key);
      extra.push(candidate);
    }
    distractors = [...distractors, ...extra];
  }

  // 4 ta variant to'planmasa (juda kam ehtimol) — savolni tashlab ketamiz
  if (distractors.length < OPTIONS_PER_QUESTION - 1) return null;

  const options = shuffle([sign, ...distractors]);
  const correctIndex = options.findIndex((o) => o.code === sign.code);

  return {
    id: `${sign.code}-${kind}`,
    kind, // "nameFromSign" | "signFromName"
    signCode: sign.code,
    category: sign.cat,
    // kind === "nameFromSign": rasm ko'rsatiladi, nomlar tanlanadi
    // kind === "signFromName": nom ko'rsatiladi, rasmlar tanlanadi
    prompt: kind === "signFromName" ? sign.name : null,
    options: options.map((o) => ({ code: o.code, name: o.name })),
    correctIndex,
  };
}

/**
 * Test yaratadi.
 *
 * @param {object} opts
 * @param {string|null} opts.category  faqat shu toifadan (null = barchasi)
 * @param {number} opts.length         savollar soni
 * @param {string[]} opts.focusCodes   shu belgilarga ustunlik (xato qilinganlar)
 */
export function generateSignsQuiz({ category = null, length = QUIZ_LENGTH_DEFAULT, focusCodes = [] } = {}) {
  const pool = category ? getSignsByCategory(category) : SIGNS;
  if (pool.length === 0) return [];

  // Xato qilingan belgilar oldinga — takrorlash orqali o'rganish.
  // Bu "hardest questions" mantig'ining belgilar uchun varianti.
  const focusSet = new Set(focusCodes);
  const focused = pool.filter((s) => focusSet.has(s.code));
  const rest = pool.filter((s) => !focusSet.has(s.code));
  const ordered = [...shuffle(focused), ...shuffle(rest)];

  const questions = [];
  for (const sign of ordered) {
    if (questions.length >= length) break;
    // Savol turini aralashtiramiz: taxminan uchdan biri teskari turda.
    // Faqat bitta turda bo'lsa, foydalanuvchi shablonga o'rganib qoladi.
    const kind = Math.random() < 0.34 ? "signFromName" : "nameFromSign";
    const q = buildQuestion(sign, kind);
    if (q) questions.push(q);
  }

  return questions;
}

/** Fisher–Yates — asl massivni o'zgartirmaydi */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
