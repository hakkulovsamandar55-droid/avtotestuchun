// ============================================================================
// RASMIY IMTIHON — qoidalar va savol tanlash (yagona manba)
//
// Bu fayl HAM frontend, HAM backend tomonidan ishlatiladi:
//   - backend: savollarni tanlash, baholash, o'tish/yiqilishni aniqlash
//   - frontend: qoidalarni ko'rsatish (20 savol, 20 daqiqa, 18 kerak)
//
// Mashq imtihoni (ticketsData.js dagi EXAM_TIME_SECONDS / EXAM_MAX_MISTAKES)
// dan BUTUNLAY ALOHIDA — u boshqa qoidalar bilan ishlaydi va o'zgarmaydi.
// ============================================================================

import { getAllQuestions } from "./ticketsData.js";

// Imtihon qoidalari versiyasi. Qoidalar kelajakda o'zgarsa (masalan o'tish
// balli 18 dan 17 ga tushsa), bu raqam oshiriladi va har bir ExamAttempt
// o'z versiyasi bilan saqlanadi — shunda eski natijalar to'g'ri talqin
// qilinadi va statistika buzilmaydi.
export const OFFICIAL_EXAM_VERSION = 1;

// Versiyaga bog'langan qoidalar. Yangi versiya qo'shilganda shu yerga
// qo'shiladi, eskisi o'chirilmaydi.
const RULES_BY_VERSION = {
  1: {
    questionCount: 20,
    durationSeconds: 20 * 60, // 20 daqiqa
    passingScore: 18, // 20 tadan kamida 18 ta to'g'ri
  },
};

export function getExamRules(version = OFFICIAL_EXAM_VERSION) {
  return RULES_BY_VERSION[version] || RULES_BY_VERSION[OFFICIAL_EXAM_VERSION];
}

// Joriy versiya qoidalari — eng ko'p ishlatiladigan holat uchun qulaylik
export const OFFICIAL_EXAM_RULES = getExamRules(OFFICIAL_EXAM_VERSION);

// Taymer ogohlantirishlari (soniyalarda). Frontend shu nuqtalarda
// foydalanuvchini ogohlantiradi.
export const TIMER_WARNINGS = [
  { atSeconds: 10 * 60, level: "info" },
  { atSeconds: 5 * 60, level: "warning" },
  { atSeconds: 60, level: "danger" },
];

// ============================================================================
// SAVOL TANLASH — deterministik (seed asosida)
//
// NIMA UCHUN SEED KERAK:
// Foydalanuvchi imtihon paytida ilovani yopishi mumkin. Qaytib kelganda
// AYNAN o'sha savollar tiklanishi shart. Agar savollar har safar tasodifiy
// tanlansa, imtihonni qayta ochish yangi savollar berardi va foydalanuvchi
// cheksiz "yangilash" orqali oson savollarni tanlab olishi mumkin edi.
//
// Seed serverda ExamAttempt.questionSeed da saqlanadi. Bir xil seed —
// har doim bir xil savollar.
// ============================================================================

// Deterministik pseudo-random generator (Lehmer / Park-Miller).
// ticketsData.js dagi seededRandom bilan bir xil algoritm, lekin u
// eksport qilinmagan, shuning uchun bu yerda alohida.
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Berilgan seed asosida imtihon savollarini tanlaydi.
 * Bir xil seed har doim bir xil natija beradi.
 *
 * @param {number} seed
 * @param {number} version — imtihon qoidalari versiyasi
 * @returns {Array} savollar (to'liq, `correct` bilan — FAQAT SERVER TOMONIDA)
 */
export function selectExamQuestions(seed, version = OFFICIAL_EXAM_VERSION) {
  const { questionCount } = getExamRules(version);
  const all = getAllQuestions();
  const rand = seededRandom(seed);

  // Fisher-Yates aralashtirish, keyin kerakli sonini olish.
  // Butun massivni nusxalash o'rniga faqat kerakli qismini tanlaymiz —
  // 1220 ta savol uchun bu sezilarli farq qilmaydi, lekin baza o'sganda
  // muhim bo'ladi.
  const arr = [...all];
  const picked = [];
  for (let i = 0; i < questionCount && arr.length > 0; i++) {
    const j = Math.floor(rand() * arr.length);
    picked.push(arr[j]);
    arr.splice(j, 1);
  }
  return picked;
}

/**
 * Savol ID'lari bo'yicha savollarni topadi (tartibni saqlagan holda).
 *
 * Nima uchun kerak: imtihon boshlanganda questionIds DB'ga yoziladi.
 * Kelajakda savol bazasi o'zgarsa (savol qo'shilsa/o'chirilsa), seed
 * boshqa natija berishi mumkin — shuning uchun tiklashda ID'lardan
 * foydalanamiz, seed esa zaxira usul sifatida qoladi.
 *
 * @param {string[]} ids
 * @returns {Array} topilgan savollar (topilmaganlari tushib qoladi)
 */
export function getQuestionsByIds(ids) {
  const all = getAllQuestions();
  const byId = new Map(all.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * Savolni FRONTEND uchun xavfsiz shaklga keltiradi — to'g'ri javob
 * olib tashlanadi.
 *
 * MUHIM: rasmiy imtihon davomida frontend hech qachon `correct` ni
 * ko'rmasligi kerak, aks holda DevTools orqali barcha javoblarni
 * o'qib olish mumkin bo'lardi.
 */
export function toPublicQuestion(question, index) {
  return {
    index,
    id: question.id,
    text: question.text,
    image: question.image || null,
    options: question.options,
  };
}

/**
 * Imtihon YAKUNLANGANDAN keyin ko'rib chiqish (review) uchun to'liq shakl.
 * Bu yerda to'g'ri javob va izoh ko'rsatiladi — imtihon allaqachon
 * baholangani uchun xavf yo'q.
 *
 * `explanation` ixtiyoriy: savol bazasida hozircha izohlar yo'q, ular
 * bosqichma-bosqich qo'shiladi. Bo'lmasa `null` qaytadi va UI uni
 * ko'rsatmaydi.
 */
export function toReviewQuestion(question, index, chosenIndex) {
  const chosen = Number.isInteger(chosenIndex) ? chosenIndex : null;
  return {
    index,
    id: question.id,
    text: question.text,
    image: question.image || null,
    options: question.options,
    correctIndex: question.correct,
    chosenIndex: chosen,
    isCorrect: chosen !== null && chosen === question.correct,
    isSkipped: chosen === null,
    explanation: question.explanation || null,
  };
}

/**
 * Javoblarni baholaydi. FAQAT SERVER TOMONIDA chaqiriladi.
 *
 * @param {Array} questions — to'liq savollar (correct bilan)
 * @param {Object} answers — {"0": 2, "3": 1} — savol indeksi -> tanlangan variant
 * @param {number} version
 */
export function gradeExam(questions, answers, version = OFFICIAL_EXAM_VERSION) {
  const { passingScore, questionCount } = getExamRules(version);

  let correctCount = 0;
  for (let i = 0; i < questions.length; i++) {
    const chosen = answers[String(i)];
    if (Number.isInteger(chosen) && chosen === questions[i].correct) {
      correctCount++;
    }
  }

  // Javob berilmagan savol XATO hisoblanadi (haqiqiy imtihondagi kabi) —
  // shuning uchun wrongCount javob berilganlar emas, umumiy sondan hisoblanadi.
  const total = questions.length || questionCount;
  const wrongCount = total - correctCount;
  const accuracyPct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = correctCount >= passingScore;

  return { correctCount, wrongCount, accuracyPct, passed, total };
}
