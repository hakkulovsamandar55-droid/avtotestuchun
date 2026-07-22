import crypto from "node:crypto";
import { prisma } from "../db.js";
import { startOfLocalDay } from "../lib/time.js";
import { logActivity } from "./activity.js";
import {
  OFFICIAL_EXAM_VERSION,
  getExamRules,
  selectExamQuestions,
  getQuestionsByIds,
  toPublicQuestion,
  toReviewQuestion,
  gradeExam,
} from "../../../shared/data/officialExam.js";

// ============================================================================
// RASMIY IMTIHON — biznes mantiqi
//
// Barcha qoidalar shu yerda. Route'lar (routes/exam.js) faqat HTTP qatlami:
// so'rovni tekshiradi, shu servisni chaqiradi, javobni qaytaradi.
//
// ASOSIY QOIDA: to'g'ri javoblar hech qachon shu fayldan tashqariga
// (frontendga) chiqmaydi. Baholash faqat shu yerda, submitExam() ichida.
// ============================================================================

// Bepul foydalanuvchi uchun kunlik limit. Premium — cheksiz.
const FREE_DAILY_EXAM_LIMIT = 1;

// Vaqti tugagan imtihonni yopishda beriladigan kichik sabr muddati.
// Tarmoq kechikishi tufayli oxirgi soniyada yuborilgan javob yo'qolmasligi
// uchun (foydalanuvchi foydasiga hal qilinadi).
const SUBMIT_GRACE_SECONDS = 5;

function parseJson(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// Imtihon hodisasini yozadi. Xatosi imtihonni to'xtatmasligi kerak —
// bu analitika uchun, asosiy oqim uchun emas.
async function recordEvent(examAttemptId, type, metadata) {
  try {
    await prisma.examEvent.create({
      data: {
        examAttemptId,
        type,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("Imtihon hodisasi yozilmadi:", err);
  }
}

// Imtihon savollarini tiklaydi.
// Avval saqlangan ID'lar bo'yicha (ishonchli usul — savol bazasi o'zgarsa ham
// aynan o'sha savollar qaytadi), agar ular topilmasa seed bo'yicha qayta
// generatsiya qilinadi (zaxira usul).
function resolveQuestions(attempt) {
  const ids = parseJson(attempt.questionIds, []);
  if (Array.isArray(ids) && ids.length > 0) {
    const byIds = getQuestionsByIds(ids);
    if (byIds.length === ids.length) return byIds;
  }
  return selectExamQuestions(attempt.questionSeed, attempt.examVersion);
}

function isExpired(attempt, now = new Date()) {
  return attempt.expiresAt.getTime() + SUBMIT_GRACE_SECONDS * 1000 <= now.getTime();
}

function secondsLeft(attempt, now = new Date()) {
  return Math.max(0, Math.round((attempt.expiresAt.getTime() - now.getTime()) / 1000));
}

/**
 * Imtihonni baholab, yakunlangan holatga o'tkazadi.
 * Vaqt tugaganda ham, foydalanuvchi qo'lda yuborganda ham shu ishlaydi.
 *
 * Atomik: `updateMany` + status sharti — bir vaqtda kelgan ikkita so'rov
 * (masalan foydalanuvchi "Yuborish" bosdi va ayni paytda vaqt tugadi)
 * imtihonni ikki marta baholab, statistikani buzmaydi.
 */
async function finalizeAttempt(attempt, { reason }) {
  const questions = resolveQuestions(attempt);
  const answers = parseJson(attempt.answers, {});
  const result = gradeExam(questions, answers, attempt.examVersion);

  const now = new Date();
  // Vaqti tugab yopilgan bo'lsa, davomiylik imtihon oxirigacha hisoblanadi
  // (foydalanuvchi ilovani yopib ketgan bo'lishi mumkin, hozirgi vaqt emas).
  const endedAt = reason === "EXPIRED" ? attempt.expiresAt : now;
  const durationSec = Math.max(
    0,
    Math.round((endedAt.getTime() - attempt.startedAt.getTime()) / 1000)
  );

  const updated = await prisma.examAttempt.updateMany({
    where: { id: attempt.id, status: "IN_PROGRESS" },
    data: {
      status: "COMPLETED",
      finishedAt: endedAt,
      durationSec,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      accuracyPct: result.accuracyPct,
      passed: result.passed,
    },
  });

  // Boshqa so'rov bizdan oldin yakunlagan — hozirgi holatni qaytaramiz
  if (updated.count === 0) {
    const fresh = await prisma.examAttempt.findUnique({ where: { id: attempt.id } });
    return { attempt: fresh, result, alreadyFinalized: true };
  }

  await recordEvent(attempt.id, reason === "EXPIRED" ? "EXPIRED" : "SUBMITTED", {
    correctCount: result.correctCount,
    passed: result.passed,
    durationSec,
  });

  // MUHIM: mavjud statistika tizimi bilan integratsiya.
  // Attempt jadvaliga ham yozamiz — shunda streak, examReadiness, passChance
  // kabi mavjud ko'rsatkichlar avtomatik ishlaydi va hech narsa buzilmaydi.
  try {
    await prisma.attempt.create({
      data: {
        userId: attempt.userId,
        type: "EXAM",
        correctCount: result.correctCount,
        totalCount: result.total,
        passed: result.passed,
      },
    });
  } catch (err) {
    console.error("Rasmiy imtihon natijasi umumiy statistikaga yozilmadi:", err);
  }

  await logActivity(
    attempt.userId,
    "TEST_COMPLETED",
    result.passed
      ? `Rasmiy imtihondan o'tdi (${result.correctCount}/${result.total})`
      : `Rasmiy imtihondan o'ta olmadi (${result.correctCount}/${result.total})`,
    { examAttemptId: attempt.id, passed: result.passed }
  );

  const fresh = await prisma.examAttempt.findUnique({ where: { id: attempt.id } });
  return { attempt: fresh, result, alreadyFinalized: false };
}

/**
 * Foydalanuvchining tugallanmagan imtihonini topadi.
 * Vaqti tugagan bo'lsa — SHU YERDA avtomatik yakunlanadi (cron kerak emas).
 */
export async function getActiveAttempt(userId) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  if (!attempt) return null;

  if (isExpired(attempt)) {
    // Foydalanuvchi ilovani yopgan va vaqt o'tgan — server o'zi yakunlaydi.
    // Bu "auto-submit when time expires" talabini cron'siz bajaradi.
    await finalizeAttempt(attempt, { reason: "EXPIRED" });
    return null;
  }

  return attempt;
}

/**
 * Bugun yana imtihon topshira oladimi?
 * Kun chegarasi mahalliy vaqt (UTC+5) bo'yicha — mavjud statistika bilan bir xil.
 */
export async function checkEligibility(user) {
  const active = await getActiveAttempt(user.id);

  if (user.isPremium) {
    return {
      canStart: true,
      isPremium: true,
      usedToday: 0,
      dailyLimit: null, // cheksiz
      remaining: null,
      hasActiveExam: Boolean(active),
      activeExamId: active?.id ?? null,
    };
  }

  const since = startOfLocalDay();
  // ABANDONED (bekor qilingan) imtihonlar limitga kirmaydi — foydalanuvchi
  // tasodifan boshlab qo'ygan bo'lsa, kunini yo'qotmasligi kerak.
  const usedToday = await prisma.examAttempt.count({
    where: { userId: user.id, status: "COMPLETED", startedAt: { gte: since } },
  });

  const remaining = Math.max(0, FREE_DAILY_EXAM_LIMIT - usedToday);

  return {
    canStart: remaining > 0 || Boolean(active),
    isPremium: false,
    usedToday,
    dailyLimit: FREE_DAILY_EXAM_LIMIT,
    remaining,
    hasActiveExam: Boolean(active),
    activeExamId: active?.id ?? null,
  };
}

/**
 * Yangi imtihon boshlaydi.
 * Faol imtihon bo'lsa, yangisini boshlamaydi — mavjudini qaytaradi
 * (aks holda foydalanuvchi savol yoqmasa qayta-qayta boshlab, oson
 * savollarni tanlab olishi mumkin bo'lardi).
 */
export async function startExam(user) {
  const existing = await getActiveAttempt(user.id);
  if (existing) {
    return { attempt: existing, resumed: true };
  }

  const eligibility = await checkEligibility(user);
  if (!eligibility.canStart) {
    const err = new Error("Bugungi imtihon limiti tugadi");
    err.code = "daily_limit_reached";
    err.eligibility = eligibility;
    throw err;
  }

  const version = OFFICIAL_EXAM_VERSION;
  const rules = getExamRules(version);

  // Seed serverda saqlanadi — imtihon tiklanganda aynan o'sha savollar.
  // crypto.randomInt — Math.random dan farqli, oldindan aytib bo'lmaydi.
  const seed = crypto.randomInt(1, 2147483646);
  const questions = selectExamQuestions(seed, version);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + rules.durationSeconds * 1000);

  const attempt = await prisma.examAttempt.create({
    data: {
      userId: user.id,
      status: "IN_PROGRESS",
      examVersion: version,
      questionSeed: seed,
      questionIds: JSON.stringify(questions.map((q) => q.id)),
      answers: "{}",
      startedAt: now,
      expiresAt,
    },
  });

  await recordEvent(attempt.id, "CREATED", { version, questionCount: questions.length });

  return { attempt, resumed: false };
}

/**
 * Imtihonni frontend uchun xavfsiz shaklga keltiradi.
 * To'g'ri javoblar OLIB TASHLANADI.
 */
export function serializeActiveExam(attempt) {
  const questions = resolveQuestions(attempt);
  const answers = parseJson(attempt.answers, {});
  const rules = getExamRules(attempt.examVersion);

  return {
    id: attempt.id,
    examVersion: attempt.examVersion,
    questions: questions.map(toPublicQuestion),
    answers, // foydalanuvchining o'z javoblari — bularni ko'rsatish xavfsiz
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    secondsLeft: secondsLeft(attempt),
    focusLostCount: attempt.focusLostCount,
    rules: {
      questionCount: rules.questionCount,
      durationSeconds: rules.durationSeconds,
      passingScore: rules.passingScore,
    },
  };
}

/**
 * Bitta javobni saqlaydi. Har javobda darhol chaqiriladi — shuning uchun
 * ilova yopilsa ham progress serverda qoladi.
 */
export async function saveAnswer(userId, examId, { questionIndex, chosenIndex }) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examId } });

  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Imtihon topilmadi");
    err.code = "not_found";
    throw err;
  }
  if (attempt.status !== "IN_PROGRESS") {
    const err = new Error("Bu imtihon allaqachon yakunlangan");
    err.code = "not_active";
    throw err;
  }

  // Vaqti tugagan bo'lsa javob QABUL QILINMAYDI va imtihon yopiladi.
  // Frontend taymerini o'zgartirish orqali qo'shimcha vaqt olishning oldi olinadi.
  if (isExpired(attempt)) {
    await finalizeAttempt(attempt, { reason: "EXPIRED" });
    const err = new Error("Imtihon vaqti tugadi");
    err.code = "expired";
    throw err;
  }

  const rules = getExamRules(attempt.examVersion);
  if (
    !Number.isInteger(questionIndex) ||
    questionIndex < 0 ||
    questionIndex >= rules.questionCount
  ) {
    const err = new Error("Noto'g'ri savol raqami");
    err.code = "invalid_question";
    throw err;
  }

  const answers = parseJson(attempt.answers, {});

  if (chosenIndex === null) {
    // Javobni bekor qilish (foydalanuvchi fikridan qaytdi)
    delete answers[String(questionIndex)];
  } else {
    if (!Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex > 3) {
      const err = new Error("Noto'g'ri variant");
      err.code = "invalid_option";
      throw err;
    }
    answers[String(questionIndex)] = chosenIndex;
  }

  await prisma.examAttempt.update({
    where: { id: examId },
    data: { answers: JSON.stringify(answers) },
  });

  return {
    answeredCount: Object.keys(answers).length,
    secondsLeft: secondsLeft(attempt),
  };
}

/**
 * Ilovadan chiqib ketish hodisasini qayd qiladi.
 *
 * ESLATMA: bu ISHONCHLI anti-cheat EMAS — hisoblagichni frontend yuboradi,
 * ya'ni texnik bilimi bor foydalanuvchi so'rovni to'sib qo'yishi mumkin.
 * Bu faqat adminlar uchun ko'rsatkich.
 */
export async function recordFocusLost(userId, examId) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examId } });
  if (!attempt || attempt.userId !== userId || attempt.status !== "IN_PROGRESS") {
    return { focusLostCount: attempt?.focusLostCount ?? 0 };
  }

  const updated = await prisma.examAttempt.update({
    where: { id: examId },
    data: { focusLostCount: { increment: 1 } },
    select: { focusLostCount: true },
  });

  await recordEvent(examId, "FOCUS_LOST", { count: updated.focusLostCount });

  return updated;
}

/** Imtihonni yakunlaydi va natijani qaytaradi. Baholash faqat shu yerda. */
export async function submitExam(userId, examId) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examId } });

  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Imtihon topilmadi");
    err.code = "not_found";
    throw err;
  }

  if (attempt.status !== "IN_PROGRESS") {
    // Allaqachon yakunlangan — natijani qaytaramiz (xato emas, chunki
    // vaqt tugab avtomatik yopilgan bo'lishi mumkin)
    return serializeResult(attempt);
  }

  const { attempt: finalized } = await finalizeAttempt(attempt, {
    reason: isExpired(attempt) ? "EXPIRED" : "SUBMITTED",
  });

  return serializeResult(finalized);
}

/** Imtihonni bekor qiladi (natija saqlanmaydi, kunlik limitga kirmaydi). */
export async function abandonExam(userId, examId) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examId } });
  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Imtihon topilmadi");
    err.code = "not_found";
    throw err;
  }

  const updated = await prisma.examAttempt.updateMany({
    where: { id: examId, status: "IN_PROGRESS" },
    data: { status: "ABANDONED", finishedAt: new Date() },
  });

  if (updated.count > 0) {
    await recordEvent(examId, "ABANDONED", null);
  }

  return { ok: true };
}

/** Yakunlangan imtihon natijasi (review'siz — faqat raqamlar). */
export function serializeResult(attempt) {
  const rules = getExamRules(attempt.examVersion);
  return {
    id: attempt.id,
    status: attempt.status,
    passed: attempt.passed,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    accuracyPct: attempt.accuracyPct,
    totalQuestions: rules.questionCount,
    passingScore: rules.passingScore,
    durationSec: attempt.durationSec,
    focusLostCount: attempt.focusLostCount,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
  };
}

/**
 * Yakunlangan imtihonni ko'rib chiqish: har bir savol, foydalanuvchi javobi,
 * to'g'ri javob va izoh (agar bo'lsa).
 *
 * Faqat YAKUNLANGAN imtihon uchun — aks holda bu javoblarni oldindan
 * ko'rish yo'li bo'lib qolardi.
 */
export async function getExamReview(userId, examId) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: examId } });

  if (!attempt || attempt.userId !== userId) {
    const err = new Error("Imtihon topilmadi");
    err.code = "not_found";
    throw err;
  }
  if (attempt.status === "IN_PROGRESS") {
    const err = new Error("Imtihon hali yakunlanmagan");
    err.code = "not_finished";
    throw err;
  }

  const questions = resolveQuestions(attempt);
  const answers = parseJson(attempt.answers, {});

  return {
    result: serializeResult(attempt),
    questions: questions.map((q, i) => toReviewQuestion(q, i, answers[String(i)])),
  };
}

/** Foydalanuvchining imtihon tarixi. */
export async function getExamHistory(userId, { limit = 20, offset = 0 } = {}) {
  const [attempts, total] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { finishedAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.examAttempt.count({ where: { userId, status: "COMPLETED" } }),
  ]);

  return { exams: attempts.map(serializeResult), total };
}
