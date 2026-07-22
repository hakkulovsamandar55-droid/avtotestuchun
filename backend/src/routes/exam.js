import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireIdParam, parsePagination } from "../lib/validate.js";
import {
  checkEligibility,
  startExam,
  getActiveAttempt,
  serializeActiveExam,
  saveAnswer,
  recordFocusLost,
  submitExam,
  abandonExam,
  getExamReview,
  getExamHistory,
} from "../services/examService.js";
import {
  getLeaderboard,
  setLeaderboardVisibility,
  PERIODS,
  SORTS,
} from "../services/leaderboardService.js";

export const examRouter = Router();

examRouter.use(requireAuth, loadCurrentUser);

// Servis xatolarini HTTP status kodlariga o'giradi — har bir handler'da
// takrorlamaslik uchun bitta joyda.
const ERROR_STATUS = {
  not_found: 404,
  not_active: 409,
  not_finished: 409,
  expired: 410,
  daily_limit_reached: 402, // Payment Required — Premium taklif qilinadi
  invalid_question: 400,
  invalid_option: 400,
};

function sendServiceError(res, err) {
  const status = ERROR_STATUS[err.code];
  if (!status) throw err; // kutilmagan xato — umumiy error handler'ga
  return res.status(status).json({
    error: err.code,
    message: err.message,
    ...(err.eligibility ? { eligibility: err.eligibility } : {}),
  });
}

// GET /api/exam/eligibility — imtihon boshlash mumkinmi
examRouter.get("/eligibility", asyncHandler(async (req, res) => {
  res.json(await checkEligibility(req.user));
}));

// POST /api/exam/start — yangi imtihon (yoki mavjud faolini qaytaradi)
examRouter.post("/start", asyncHandler(async (req, res) => {
  try {
    const { attempt, resumed } = await startExam(req.user);
    res.status(resumed ? 200 : 201).json({
      resumed,
      exam: serializeActiveExam(attempt),
    });
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// GET /api/exam/active — tugallanmagan imtihonni tiklash
examRouter.get("/active", asyncHandler(async (req, res) => {
  const attempt = await getActiveAttempt(req.user.id);
  if (!attempt) return res.json({ exam: null });
  res.json({ exam: serializeActiveExam(attempt) });
}));

// PATCH /api/exam/:id/answer  { questionIndex, chosenIndex }
// chosenIndex = null bo'lsa javob bekor qilinadi
examRouter.patch("/:id/answer", requireIdParam, asyncHandler(async (req, res) => {
  try {
    const result = await saveAnswer(req.user.id, req.id, {
      questionIndex: req.body.questionIndex,
      chosenIndex: req.body.chosenIndex ?? null,
    });
    res.json(result);
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// POST /api/exam/:id/focus-lost — ilovadan chiqib ketish qayd etiladi
examRouter.post("/:id/focus-lost", requireIdParam, asyncHandler(async (req, res) => {
  res.json(await recordFocusLost(req.user.id, req.id));
}));

// POST /api/exam/:id/submit — yakunlash va baholash (server tomonida)
examRouter.post("/:id/submit", requireIdParam, asyncHandler(async (req, res) => {
  try {
    res.json({ result: await submitExam(req.user.id, req.id) });
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// POST /api/exam/:id/abandon — bekor qilish
examRouter.post("/:id/abandon", requireIdParam, asyncHandler(async (req, res) => {
  try {
    res.json(await abandonExam(req.user.id, req.id));
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// GET /api/exam/:id/review — savol/javob/izoh (faqat yakunlangandan keyin)
examRouter.get("/:id/review", requireIdParam, asyncHandler(async (req, res) => {
  try {
    res.json(await getExamReview(req.user.id, req.id));
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// GET /api/exam/history?limit=&offset=
examRouter.get("/history", asyncHandler(async (req, res) => {
  const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  res.json(await getExamHistory(req.user.id, { limit, offset }));
}));

// GET /api/exam/leaderboard?period=all_time|this_month&sort=score|speed|accuracy
examRouter.get("/leaderboard", asyncHandler(async (req, res) => {
  const period = PERIODS[req.query.period] ? req.query.period : "all_time";
  const sort = SORTS[req.query.sort] ? req.query.sort : "score";

  res.json(
    await getLeaderboard({
      period,
      sort,
      limit: 50,
      currentUserId: req.user.id,
    })
  );
}));

// PATCH /api/exam/leaderboard-visibility  { visible: boolean }
examRouter.patch("/leaderboard-visibility", asyncHandler(async (req, res) => {
  if (typeof req.body.visible !== "boolean") {
    return res.status(400).json({ error: "visible true yoki false bo'lishi kerak" });
  }
  res.json(await setLeaderboardVisibility(req.user.id, req.body.visible));
}));

// GET /api/exam/me — foydalanuvchining imtihon sozlamalari/qisqacha holati.
// Sozlamalar ekrani shu orqali toggle holatini biladi.
examRouter.get("/me", asyncHandler(async (req, res) => {
  const [eligibility, best] = await Promise.all([
    checkEligibility(req.user),
    prisma.examAttempt.findFirst({
      where: { userId: req.user.id, status: "COMPLETED", passed: true },
      orderBy: [{ correctCount: "desc" }, { durationSec: "asc" }],
      select: { correctCount: true, accuracyPct: true, durationSec: true, finishedAt: true },
    }),
  ]);

  res.json({
    eligibility,
    showOnLeaderboard: req.user.showOnLeaderboard,
    bestResult: best,
  });
}));
