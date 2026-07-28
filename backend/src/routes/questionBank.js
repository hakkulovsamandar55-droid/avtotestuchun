import { Router } from "express";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import * as svc from "../services/questionBankService.js";

export const questionBankRouter = Router();

// Barcha endpointlar autentifikatsiya talab qiladi — bu foydalanuvchining
// shaxsiy ma'lumoti (saqlangan savollar, xatolar tarixi).
questionBankRouter.use(requireAuth, loadCurrentUser);

const ERROR_STATUS = { invalid_input: 400, not_found: 404 };

function sendError(res, err) {
  const status = ERROR_STATUS[err.code];
  if (!status) throw err;
  return res.status(status).json({ error: err.code, message: err.message });
}

// GET /api/questions/saved
questionBankRouter.get(
  "/saved",
  asyncHandler(async (req, res) => {
    res.json({ saved: await svc.listSaved(req.user.id) });
  })
);

// POST /api/questions/saved  { questionId }
questionBankRouter.post(
  "/saved",
  asyncHandler(async (req, res) => {
    try {
      res.status(201).json(await svc.saveQuestion(req.user.id, req.body?.questionId));
    } catch (err) {
      return sendError(res, err);
    }
  })
);

// DELETE /api/questions/saved/:questionId
questionBankRouter.delete(
  "/saved/:questionId",
  asyncHandler(async (req, res) => {
    try {
      res.json(await svc.unsaveQuestion(req.user.id, req.params.questionId));
    } catch (err) {
      return sendError(res, err);
    }
  })
);

// GET /api/questions/mistakes — mening hal qilinmagan xatolarim
questionBankRouter.get(
  "/mistakes",
  asyncHandler(async (req, res) => {
    res.json({ mistakes: await svc.listMyMistakes(req.user.id) });
  })
);

// DELETE /api/questions/mistakes — barcha xatolarni tozalash
//
// TARTIB MUHIM: bu marshrut ":questionId" li marshrutdan OLDIN turishi
// kerak, aks holda Express "mistakes" so'zini questionId deb qabul
// qilib, noto'g'ri handler'ga yuborardi.
questionBankRouter.delete(
  "/mistakes",
  asyncHandler(async (req, res) => {
    res.json(await svc.resolveAllMistakes(req.user.id));
  })
);

// DELETE /api/questions/mistakes/:questionId — bitta xatoni tozalash
questionBankRouter.delete(
  "/mistakes/:questionId",
  asyncHandler(async (req, res) => {
    try {
      res.json(await svc.resolveMistake(req.user.id, req.params.questionId));
    } catch (err) {
      return sendError(res, err);
    }
  })
);

// GET /api/questions/hardest — ko'pchilik xato qiladigan savollar
// TOP 10 — bu "eng qiyin savollar reytingi", cheksiz ro'yxat emas.
// Ko'p bo'lsa foydalanuvchi uchun ma'nosini yo'qotadi (deyarli barcha
// savollar biroz xato qilingan bo'lishi mumkin).
questionBankRouter.get(
  "/hardest",
  asyncHandler(async (req, res) => {
    res.json({ questions: await svc.listHardestQuestions({ limit: 10 }) });
  })
);

// POST /api/questions/answers  { answers: [{ questionId, isCorrect }] }
//
// Test tugagach chaqiriladi. Global statistika va foydalanuvchi xatolari
// shu yerdan to'ladi.
questionBankRouter.post(
  "/answers",
  asyncHandler(async (req, res) => {
    try {
      res.json(await svc.recordAnswers(req.user.id, req.body?.answers));
    } catch (err) {
      return sendError(res, err);
    }
  })
);

// GET /api/questions/tricky — chalg'ituvchi test uchun savol ID'lari
//
// Savol MATNI qaytarilmaydi — faqat ID. Matnlar allaqachon ilova ichida
// (shared/data/ticketsData.js), ularni tarmoq orqali qayta yuborish
// ma'nosiz trafik bo'lardi.
questionBankRouter.get(
  "/tricky",
  asyncHandler(async (req, res) => {
    const ids = await svc.getTrickyQuestionIds(req.user.id);
    res.json({ questionIds: ids });
  })
);
