import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { asyncHandler } from "../asyncHandler.js";

export const statsRouter = Router();

// Ushbu bo'limdagi barcha endpointlar login qilingan foydalanuvchini talab qiladi
statsRouter.use(requireAuth);

const TOTAL_TICKETS = 60; // src/data/ticketsData.js dagi TOTAL_TICKETS bilan mos

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
  if (type === "TICKET" && !Number.isInteger(ticketNumber)) {
    return res.status(400).json({ error: "TICKET uchun ticketNumber shart" });
  }

  const attempt = await prisma.attempt.create({
    data: {
      userId: req.auth.sub,
      type,
      ticketNumber: type === "TICKET" ? ticketNumber : null,
      correctCount,
      totalCount,
      passed: Boolean(passed),
    },
  });

  res.json({ attempt });
}));

// GET /api/stats/me — real statistikani hisoblab qaytaradi
statsRouter.get("/me", asyncHandler(async (req, res) => {
  const userId = req.auth.sub;
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (attempts.length === 0) {
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
    });
  }

  const ticketAttempts = attempts.filter((a) => a.type === "TICKET");
  const examAttempts = attempts.filter((a) => a.type === "EXAM");

  const totalCorrect = attempts.reduce((s, a) => s + a.correctCount, 0);
  const totalAnswered = attempts.reduce((s, a) => s + a.totalCount, 0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const solved = totalAnswered;

  const passedTicketNumbers = new Set(
    ticketAttempts.filter((a) => a.passed).map((a) => a.ticketNumber)
  );
  const completedTickets = passedTicketNumbers.size;

  const attemptedTicketNumbers = new Set(ticketAttempts.map((a) => a.ticketNumber));
  const learnedQuestionsPct = Math.round(
    (attemptedTicketNumbers.size / TOTAL_TICKETS) * 100
  );

  const ticketCorrect = ticketAttempts.reduce((s, a) => s + a.correctCount, 0);
  const ticketTotal = ticketAttempts.reduce((s, a) => s + a.totalCount, 0);
  const masteryQualityPct =
    ticketTotal > 0 ? Math.round((ticketCorrect / ticketTotal) * 100) : 0;

  const examPassed = examAttempts.filter((a) => a.passed).length;
  const examResultsPct =
    examAttempts.length > 0 ? Math.round((examPassed / examAttempts.length) * 100) : 0;

  // Ketma-ket faol kunlar soni (createdAt sanalaridan, eng oxirgi kundan orqaga qarab)
  const dayKeys = [
    ...new Set(attempts.map((a) => a.createdAt.toISOString().slice(0, 10))),
  ].sort((a, b) => (a < b ? 1 : -1)); // eng yangi kun birinchi

  let streakDays = 0;
  if (dayKeys.length > 0) {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const today = new Date().toISOString().slice(0, 10);
    const mostRecent = dayKeys[0];
    const gapFromToday = (new Date(today) - new Date(mostRecent)) / oneDayMs;

    // Streak faqat bugun yoki kecha faollik bo'lsa hisoblanadi (aks holda uzilgan)
    if (gapFromToday <= 1) {
      streakDays = 1;
      for (let i = 0; i < dayKeys.length - 1; i++) {
        const diff = (new Date(dayKeys[i]) - new Date(dayKeys[i + 1])) / oneDayMs;
        if (diff === 1) streakDays++;
        else break;
      }
    }
  }

  // Imtihonga tayyorgarlik va o'tish ehtimoli — sodda formulaga asoslangan taxmin,
  // haqiqiy AI bashorati emas: umumiy aniqlik, bilet qamrovi va imtihon natijalarining
  // og'irlik bilan o'rtachasi.
  const examReadiness = Math.round(
    masteryQualityPct * 0.4 + learnedQuestionsPct * 0.3 + examResultsPct * 0.3
  );
  const passChance = examAttempts.length > 0 ? examResultsPct : Math.round(examReadiness * 0.6);

  res.json({
    accuracy,
    solved,
    completedTickets,
    streakDays,
    examReadiness,
    passChance,
    learnedQuestionsPct,
    masteryQualityPct,
    examResultsPct,
  });
}));
