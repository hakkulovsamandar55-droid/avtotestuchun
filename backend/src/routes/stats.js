import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { TOTAL_TICKETS } from "../data/ticketsData.js";
// Kun chegarasi mahalliy vaqtga (UTC+5) ko'ra hisoblanadi — lib/time.js ga qarang.
import { localDayKey } from "../lib/time.js";

export const statsRouter = Router();

// Ushbu bo'limdagi barcha endpointlar login qilingan foydalanuvchini talab qiladi
statsRouter.use(requireAuth, loadCurrentUser);


// POST /api/stats/attempt — bilet testi yoki imtihon yakunlanganda natijani saqlaydi
statsRouter.post("/attempt", asyncHandler(async (req, res) => {
  const { type, ticketNumber, correctCount, totalCount, passed } = req.body;

  if (!["TICKET", "EXAM"].includes(type)) {
    return res.status(400).json({ error: "type TICKET yoki EXAM bo'lishi kerak" });
  }
  if (
    !Number.isInteger(correctCount) ||
    !Number.isInteger(totalCount) ||
    correctCount < 0 ||
    totalCount <= 0 ||
    correctCount > totalCount
  ) {
    return res.status(400).json({ error: "correctCount/totalCount noto'g'ri" });
  }
  // Bir urinishda ko'pi bilan shuncha savol bo'ladi — bundan kattasi qalbaki
  // so'rov (masalan statistikani sun'iy ko'tarish uchun).
  if (totalCount > 100) {
    return res.status(400).json({ error: "totalCount juda katta" });
  }
  // Ilgari ticketNumber faqat "butun sonmi" deb tekshirilardi — 9999 yoki -5
  // kabi mavjud bo'lmagan bilet raqami ham bazaga tushib, statistikani
  // (masalan "o'rganilgan biletlar foizi") buzardi.
  if (type === "TICKET") {
    if (!Number.isInteger(ticketNumber) || ticketNumber < 1 || ticketNumber > TOTAL_TICKETS) {
      return res
        .status(400)
        .json({ error: `ticketNumber 1 va ${TOTAL_TICKETS} orasida bo'lishi kerak` });
    }
  }

  const attempt = await prisma.attempt.create({
    data: {
      userId: req.user.id,
      type,
      ticketNumber: type === "TICKET" ? ticketNumber : null,
      correctCount,
      totalCount,
      passed: Boolean(passed),
    },
  });

  res.json({ attempt });
}));

// Foydalanuvchi ro'yxatdan o'tishda tanlagan kunlik reja bilan so'nggi
// 7 kunlik haqiqiy faollikni solishtiradi. Har bir "kun"dagi urinishlar
// soni taxminiy o'rtacha vaqtga (bir urinish ~1.5 daqiqa) ko'paytiriladi —
// aniq vaqt o'lchanmagani uchun bu faqat yo'naltiruvchi ko'rsatkich.
const AVG_MINUTES_PER_ATTEMPT = 1.5;

function computeStudyPlanProgress(recentDayCounts, dailyStudyMinutes) {
  if (!dailyStudyMinutes) return null;

  const activeDays = recentDayCounts.size;
  const totalMinutes = [...recentDayCounts.values()].reduce(
    (sum, count) => sum + count * AVG_MINUTES_PER_ATTEMPT,
    0
  );

  const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const planProgressPct = Math.min(100, Math.round((avgDailyMinutes / dailyStudyMinutes) * 100));

  return { dailyStudyMinutes, avgDailyMinutes, activeDaysLast7: activeDays, planProgressPct };
}

// Ketma-ket faol kunlar. Streak faqat bugun yoki kecha faollik bo'lsa davom etadi.
function computeStreak(dayKeys) {
  if (dayKeys.length === 0) return 0;

  const sorted = [...dayKeys].sort().reverse(); // eng yangi kun birinchi
  const oneDayMs = 24 * 60 * 60 * 1000;
  const today = localDayKey(new Date());

  const gapFromToday = (new Date(today) - new Date(sorted[0])) / oneDayMs;
  if (gapFromToday > 1) return 0; // streak uzilgan

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i + 1])) / oneDayMs;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

// GET /api/stats/me — real statistikani hisoblab qaytaradi
statsRouter.get("/me", asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Ilgari bu yerda foydalanuvchining BARCHA urinishlari (cheklovsiz)
  // xotiraga yuklanardi va statistika JS'da hisoblanardi — faol
  // foydalanuvchida bu minglab qatorni anglatadi. Endi og'ir yig'indilar
  // DB'da hisoblanadi, faqat streak uchun kerakli minimal ma'lumot o'qiladi.
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [totals, ticketTotals, examGroups, passedTickets, attemptedTickets, recentDates] =
    await Promise.all([
      prisma.attempt.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: { correctCount: true, totalCount: true },
      }),
      prisma.attempt.aggregate({
        where: { userId, type: "TICKET" },
        _sum: { correctCount: true, totalCount: true },
      }),
      prisma.attempt.groupBy({
        by: ["passed"],
        where: { userId, type: "EXAM" },
        _count: { _all: true },
      }),
      prisma.attempt.findMany({
        where: { userId, type: "TICKET", passed: true },
        distinct: ["ticketNumber"],
        select: { ticketNumber: true },
      }),
      prisma.attempt.findMany({
        where: { userId, type: "TICKET" },
        distinct: ["ticketNumber"],
        select: { ticketNumber: true },
      }),
      // Streak uchun oxirgi 90 kun yetarli — undan uzoq uzluksiz streak amalda kam
      prisma.attempt.findMany({
        where: { userId, createdAt: { gte: ninetyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  // Kunlar bo'yicha guruhlash (mahalliy vaqt zonasida)
  const dayCounts = new Map();
  const recentDayCounts = new Map();
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const { createdAt } of recentDates) {
    const key = localDayKey(createdAt);
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
    if (createdAt.getTime() >= sevenDaysAgoMs) {
      recentDayCounts.set(key, (recentDayCounts.get(key) || 0) + 1);
    }
  }

  const studyPlan = computeStudyPlanProgress(recentDayCounts, req.user.dailyStudyMinutes);

  if (totals._count._all === 0) {
    return res.json({
      accuracy: 0,
      solved: 0,
      completedTickets: 0,
      streakDays: 0,
      examReadiness: 0,
      passChance: 0,
      learnedQuestionsPct: 0,
      masteryQualityPct: 0,
      examResultsPct: 0,
      studyPlan,
    });
  }

  const totalCorrect = totals._sum.correctCount || 0;
  const totalAnswered = totals._sum.totalCount || 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const completedTickets = passedTickets.length;
  // Math.min — bilet raqami noto'g'ri bo'lsa 100% dan oshib ketmasligi uchun
  const learnedQuestionsPct = Math.min(
    100,
    Math.round((attemptedTickets.length / TOTAL_TICKETS) * 100)
  );

  const ticketCorrect = ticketTotals._sum.correctCount || 0;
  const ticketTotal = ticketTotals._sum.totalCount || 0;
  const masteryQualityPct = ticketTotal > 0 ? Math.round((ticketCorrect / ticketTotal) * 100) : 0;

  const examPassed = examGroups.find((g) => g.passed === true)?._count._all || 0;
  const examFailed = examGroups.find((g) => g.passed === false)?._count._all || 0;
  const examCount = examPassed + examFailed;
  const examResultsPct = examCount > 0 ? Math.round((examPassed / examCount) * 100) : 0;

  const streakDays = computeStreak([...dayCounts.keys()]);

  // Imtihonga tayyorgarlik va o'tish ehtimoli — sodda formulaga asoslangan taxmin,
  // haqiqiy AI bashorati emas: umumiy aniqlik, bilet qamrovi va imtihon natijalarining
  // og'irlik bilan o'rtachasi.
  const examReadiness = Math.round(
    masteryQualityPct * 0.4 + learnedQuestionsPct * 0.3 + examResultsPct * 0.3
  );
  const passChance = examCount > 0 ? examResultsPct : Math.round(examReadiness * 0.6);

  // examReadiness User jadvalida ham saqlanadi — admin panel (AI Rating ustuni)
  // va filtrlar shu ustundan foydalanadi. Ilgari bu qiymat hech qachon
  // yangilanmasdi va admin panelda har doim 0 ko'rinardi.
  if (req.user.examReadiness !== examReadiness) {
    prisma.user
      .update({ where: { id: userId }, data: { examReadiness } })
      .catch((err) => console.error("examReadiness saqlanmadi:", err));
  }

  res.json({
    accuracy,
    solved: totalAnswered,
    completedTickets,
    streakDays,
    examReadiness,
    passChance,
    learnedQuestionsPct,
    masteryQualityPct,
    examResultsPct,
    studyPlan,
  });
}));
