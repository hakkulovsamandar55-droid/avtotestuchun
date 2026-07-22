import { prisma } from "../db.js";
import { startOfLocalDay, startOfLocalMonth } from "../lib/time.js";
import { getQuestionsByIds } from "../../../shared/data/officialExam.js";

// ============================================================================
// RASMIY IMTIHON — admin analitikasi
//
// "Eng ko'p xato qilingan savollar" hisobi savollar DB'da emas, JSON
// ustunlarda saqlangani uchun biroz murakkab. Yechim: oxirgi N ta imtihonni
// o'qib, JS'da yig'amiz.
//
// Nima uchun bu maqbul: admin analitikasi kamdan-kam ochiladi va so'nggi
// 500 imtihon statistik jihatdan yetarli namuna beradi. Kelajakda imtihonlar
// soni juda ko'payib ketsa, natijani keshlash yoki alohida agregat jadval
// qo'shish kerak bo'ladi (o'shanda faqat shu fayl o'zgaradi).
// ============================================================================

const QUESTION_STATS_SAMPLE_SIZE = 500;
const TOP_QUESTIONS_COUNT = 10;

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

/** Umumiy ko'rsatkichlar: jami, o'rtacha ball, o'tish foizi, o'rtacha vaqt. */
export async function getExamOverview() {
  const completedWhere = { status: "COMPLETED" };

  const [totals, passedCount, todayCount, monthCount] = await Promise.all([
    prisma.examAttempt.aggregate({
      where: completedWhere,
      _count: { _all: true },
      _avg: { correctCount: true, accuracyPct: true, durationSec: true },
    }),
    prisma.examAttempt.count({ where: { ...completedWhere, passed: true } }),
    prisma.examAttempt.count({
      where: { ...completedWhere, finishedAt: { gte: startOfLocalDay() } },
    }),
    prisma.examAttempt.count({
      where: { ...completedWhere, finishedAt: { gte: startOfLocalMonth() } },
    }),
  ]);

  const total = totals._count._all;
  const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

  return {
    totalExams: total,
    passedExams: passedCount,
    failedExams: total - passedCount,
    passRatePct: passRate,
    failRatePct: total > 0 ? 100 - passRate : 0,
    averageScore: totals._avg.correctCount ? Math.round(totals._avg.correctCount * 10) / 10 : 0,
    averageAccuracyPct: totals._avg.accuracyPct ? Math.round(totals._avg.accuracyPct) : 0,
    averageDurationSec: totals._avg.durationSec ? Math.round(totals._avg.durationSec) : 0,
    examsToday: todayCount,
    examsThisMonth: monthCount,
  };
}

/**
 * Savollar bo'yicha statistika: qaysi savollarda ko'proq xato qilinadi.
 *
 * Har bir imtihonning questionIds va answers ustunlarini o'qib, savol
 * ID'si bo'yicha to'g'ri/noto'g'ri javoblarni sanaymiz.
 */
export async function getQuestionDifficultyStats() {
  const attempts = await prisma.examAttempt.findMany({
    where: { status: "COMPLETED" },
    orderBy: { finishedAt: "desc" },
    take: QUESTION_STATS_SAMPLE_SIZE,
    select: { questionIds: true, answers: true },
  });

  // questionId -> { shown, correct }
  const stats = new Map();

  for (const attempt of attempts) {
    const ids = parseJson(attempt.questionIds, []);
    const answers = parseJson(attempt.answers, {});
    if (!Array.isArray(ids) || ids.length === 0) continue;

    // Savollarni bir marta yuklab, to'g'ri javoblarni bilamiz
    const questions = getQuestionsByIds(ids);
    if (questions.length !== ids.length) continue; // savol bazasi o'zgargan — o'tkazamiz

    questions.forEach((q, index) => {
      const entry = stats.get(q.id) || { shown: 0, correct: 0, text: q.text };
      entry.shown++;
      const chosen = answers[String(index)];
      if (Number.isInteger(chosen) && chosen === q.correct) entry.correct++;
      stats.set(q.id, entry);
    });
  }

  // Kamida shuncha marta ko'rsatilgan savollargina hisobga olinadi —
  // 1-2 marta chiqqan savol bo'yicha "100% xato" degan xulosa yasash noto'g'ri.
  const MIN_SAMPLE = 5;

  const rows = [...stats.entries()]
    .filter(([, s]) => s.shown >= MIN_SAMPLE)
    .map(([id, s]) => ({
      id,
      text: s.text,
      shown: s.shown,
      correct: s.correct,
      wrong: s.shown - s.correct,
      correctRatePct: Math.round((s.correct / s.shown) * 100),
    }));

  const byCorrectRate = [...rows].sort((a, b) => a.correctRatePct - b.correctRatePct);

  return {
    sampleSize: attempts.length,
    hardest: byCorrectRate.slice(0, TOP_QUESTIONS_COUNT),
    easiest: byCorrectRate.slice(-TOP_QUESTIONS_COUNT).reverse(),
  };
}

/** Bitta foydalanuvchining imtihon xulosasi — admin profilida ko'rsatiladi. */
export async function getUserExamSummary(userId) {
  const [aggregate, passedCount, recent] = await Promise.all([
    prisma.examAttempt.aggregate({
      where: { userId, status: "COMPLETED" },
      _count: { _all: true },
      _avg: { correctCount: true, accuracyPct: true, durationSec: true },
      _sum: { focusLostCount: true },
    }),
    prisma.examAttempt.count({ where: { userId, status: "COMPLETED", passed: true } }),
    prisma.examAttempt.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: { finishedAt: "desc" },
      take: 10,
      select: {
        id: true,
        correctCount: true,
        accuracyPct: true,
        durationSec: true,
        passed: true,
        focusLostCount: true,
        finishedAt: true,
      },
    }),
  ]);

  const total = aggregate._count._all;

  return {
    totalExams: total,
    passedExams: passedCount,
    failedExams: total - passedCount,
    passRatePct: total > 0 ? Math.round((passedCount / total) * 100) : 0,
    averageScore: aggregate._avg.correctCount
      ? Math.round(aggregate._avg.correctCount * 10) / 10
      : 0,
    averageDurationSec: aggregate._avg.durationSec
      ? Math.round(aggregate._avg.durationSec)
      : 0,
    // Ilovadan chiqib ketishlar yig'indisi — bu ISHONCHLI anti-cheat emas,
    // faqat ko'rsatkich (frontend yuboradi, to'sib qo'yish mumkin).
    totalFocusLost: aggregate._sum.focusLostCount || 0,
    recentExams: recent,
  };
}
