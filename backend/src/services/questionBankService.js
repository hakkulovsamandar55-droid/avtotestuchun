import { prisma } from "../db.js";

// ============================================================================
// SAVOLLAR BANKI — saqlangan savollar, xatolar, global statistika
//
// UCHTA MUSTAQIL VAZIFA:
//   1) Saqlangan savollar — foydalanuvchi qo'lda belgilaydi
//   2) Mening xatolarim — avtomatik to'planadi
//   3) Ko'pchilik xato qiladigan savollar — global agregat
//
// Ikkinchi va uchinchisi BIR JOYDAN to'ladi: recordAnswers(). Test ekrani
// har savol uchun to'g'ri/xato natijani yuboradi.
// ============================================================================

export class QuestionBankError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Bir so'rovda ko'pi bilan shuncha javob qabul qilinadi.
// Rasmiy imtihon 20 savol, mashq 50 gacha — 100 xavfsiz yuqori chegara.
const MAX_ANSWERS_PER_CALL = 100;

/**
 * Test tugagach har bir savol natijasini yozadi.
 *
 * IKKI JOYGA yoziladi:
 *   - question_stats  (global: qancha ishlangan, qancha xato)
 *   - question_mistakes (shu foydalanuvchining xatolari)
 *
 * NIMA UCHUN TRANZAKSIYA EMAS: bu statistika, biznes amali emas. Qisman
 * yozilib qolsa ham hech narsa buzilmaydi va foydalanuvchi buni sezmaydi.
 * Tranzaksiya esa 20 savol uchun uzoq blokirovka berardi.
 *
 * @param {number} userId
 * @param {Array<{questionId: string, isCorrect: boolean}>} answers
 */
export async function recordAnswers(userId, answers) {
  if (!Array.isArray(answers) || answers.length === 0) return { recorded: 0 };
  if (answers.length > MAX_ANSWERS_PER_CALL) {
    throw new QuestionBankError("invalid_input", "Javoblar soni juda katta");
  }

  // Bir savol bir necha marta kelishi mumkin emas — oxirgisini olamiz.
  // Aks holda global statistika bir urinishda ikki marta oshib ketardi.
  const byId = new Map();
  for (const a of answers) {
    const qid = typeof a?.questionId === "string" ? a.questionId.trim() : "";
    if (!qid || qid.length > 64) continue;
    byId.set(qid, Boolean(a.isCorrect));
  }
  if (byId.size === 0) return { recorded: 0 };

  const wrongIds = [];
  const correctIds = [];
  for (const [qid, ok] of byId) (ok ? correctIds : wrongIds).push(qid);

  // --- 1) Global statistika ---
  // upsert har savol uchun alohida so'rov, lekin bu 20 ta — qabul qilinadi.
  // createMany + updateMany bilan qilish mumkin emas, chunki increment kerak.
  await Promise.all(
    [...byId.entries()].map(([qid, ok]) =>
      prisma.questionStat
        .upsert({
          where: { questionId: qid },
          create: { questionId: qid, totalCount: 1, wrongCount: ok ? 0 : 1 },
          update: {
            totalCount: { increment: 1 },
            ...(ok ? {} : { wrongCount: { increment: 1 } }),
          },
        })
        .catch(() => null) // statistika xatosi asosiy oqimni buzmasligi kerak
    )
  );

  // --- 2) Foydalanuvchi xatolari ---
  await Promise.all(
    wrongIds.map((qid) =>
      prisma.questionMistake
        .upsert({
          where: { userId_questionId: { userId, questionId: qid } },
          create: { userId, questionId: qid },
          update: {
            wrongCount: { increment: 1 },
            lastWrongAt: new Date(),
            // Avval hal qilingan bo'lsa, qayta xato qilindi — ochiq holatga
            // qaytaramiz. Aks holda foydalanuvchi "xatolarim" ro'yxatida
            // uni ko'rmasdi va takrorlay olmasdi.
            resolvedAt: null,
          },
        })
        .catch(() => null)
    )
  );

  // --- 3) To'g'ri javob berilganlar hal qilingan deb belgilanadi ---
  // O'CHIRILMAYDI: tarix foydali ("avval xato qilgan, endi biladi") va
  // takroriy xatoda wrongCount saqlanib qoladi.
  if (correctIds.length > 0) {
    await prisma.questionMistake
      .updateMany({
        where: { userId, questionId: { in: correctIds }, resolvedAt: null },
        data: { resolvedAt: new Date() },
      })
      .catch(() => null);
  }

  return { recorded: byId.size };
}

/** Foydalanuvchining hal qilinmagan xatolari — eng ko'p xato qilgani birinchi. */
export async function listMyMistakes(userId, { limit = 100 } = {}) {
  const rows = await prisma.questionMistake.findMany({
    where: { userId, resolvedAt: null },
    orderBy: [{ wrongCount: "desc" }, { lastWrongAt: "desc" }],
    take: Math.min(limit, 200),
  });
  return rows.map((r) => ({
    questionId: r.questionId,
    wrongCount: r.wrongCount,
    lastWrongAt: r.lastWrongAt,
  }));
}

/**
 * Ko'pchilik xato qiladigan savollar.
 *
 * MUHIM: `minAttempts` chegarasi bor. Chegarasiz bitta odam bir marta xato
 * qilgan savol 100% xato ko'rsatkichi bilan birinchi o'rinda turardi — bu
 * "eng qiyin savol" degani emas, shunchaki ma'lumot yetarli emas.
 */
export async function listHardestQuestions({ limit = 50, minAttempts = 5 } = {}) {
  const rows = await prisma.questionStat.findMany({
    where: { totalCount: { gte: minAttempts } },
    orderBy: { wrongCount: "desc" },
    take: 500, // keyin foizga qayta tartiblanadi
  });

  return rows
    .map((r) => ({
      questionId: r.questionId,
      totalCount: r.totalCount,
      wrongCount: r.wrongCount,
      wrongPct: r.totalCount > 0 ? Math.round((r.wrongCount / r.totalCount) * 100) : 0,
    }))
    .filter((r) => r.wrongPct > 0)
    // Foiz bo'yicha — mutlaq son emas. Ko'p ishlangan oson savol mutlaq
    // xato soni bo'yicha yuqorida turishi mumkin, lekin u qiyin emas.
    .sort((a, b) => b.wrongPct - a.wrongPct || b.totalCount - a.totalCount)
    .slice(0, Math.min(limit, 100));
}

// ---- Saqlangan savollar ----

export async function listSaved(userId) {
  const rows = await prisma.savedQuestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.map((r) => ({ questionId: r.questionId, savedAt: r.createdAt }));
}

/**
 * Savolni saqlaydi. Idempotent — ikki marta bosilsa xato bermaydi.
 */
export async function saveQuestion(userId, questionId) {
  const qid = typeof questionId === "string" ? questionId.trim() : "";
  if (!qid || qid.length > 64) {
    throw new QuestionBankError("invalid_input", "Noto'g'ri savol ID");
  }
  try {
    await prisma.savedQuestion.create({ data: { userId, questionId: qid } });
  } catch (err) {
    // P2002 — allaqachon saqlangan. Bu xato emas, kutilgan holat.
    if (err?.code !== "P2002") throw err;
  }
  return { saved: true };
}

export async function unsaveQuestion(userId, questionId) {
  const qid = typeof questionId === "string" ? questionId.trim() : "";
  if (!qid) throw new QuestionBankError("invalid_input", "Noto'g'ri savol ID");

  await prisma.savedQuestion.deleteMany({ where: { userId, questionId: qid } });
  return { saved: false };
}

/**
 * CHALG'ITUVCHI TEST uchun savol ID'lari.
 *
 * "Chalg'ituvchi" — ko'pchilik xato qiladigan savollar. Ular odatda
 * variantlari bir-biriga juda o'xshash yoki savol shartida arzimas
 * ko'ringan lekin muhim tafsilot bo'lgan savollar.
 *
 * IKKI MANBA, TARTIB BILAN:
 *   1) GLOBAL statistika (question_stats) — haqiqiy ma'lumot: qaysi savolda
 *      odamlar ko'p xato qilgan. Eng ishonchli, lekin ilova yangi bo'lsa
 *      yoki savol kam ishlangan bo'lsa yetarli ma'lumot bo'lmaydi.
 *   2) Foydalanuvchining SHAXSIY xatolari — global ma'lumot yetmasa,
 *      hech bo'lmasa o'z xatolaridan test tuzamiz.
 *
 * NIMA UCHUN minAttempts PAST (3): bu yerda maqsad "eng qiyin savollar
 * reytingi" emas, balki TEST UCHUN savol to'plash. Chegara juda baland
 * bo'lsa yangi ilovada test umuman tuzilmaydi. Lekin 1-2 urinishli
 * savollarni olmaymiz — bitta odamning tasodifiy xatosi "chalg'ituvchi"
 * degani emas.
 */
export async function getTrickyQuestionIds(userId, { limit = 20 } = {}) {
  const ids = [];
  const seen = new Set();

  // 1) Global: ko'pchilik xato qiladigan savollar
  const global = await listHardestQuestions({ limit: limit * 2, minAttempts: 3 });
  for (const q of global) {
    // 40% dan kam xato bo'lsa "chalg'ituvchi" deb hisoblamaymiz —
    // bu oddiy savol, ba'zilar shunchaki e'tiborsiz javob bergan.
    if (q.wrongPct < 40) continue;
    if (seen.has(q.questionId)) continue;
    seen.add(q.questionId);
    ids.push(q.questionId);
    if (ids.length >= limit) break;
  }

  // 2) Yetmasa — foydalanuvchining o'z xatolari bilan to'ldiramiz
  if (ids.length < limit) {
    const mine = await listMyMistakes(userId, { limit: limit * 2 });
    for (const m of mine) {
      if (seen.has(m.questionId)) continue;
      seen.add(m.questionId);
      ids.push(m.questionId);
      if (ids.length >= limit) break;
    }
  }

  return ids;
}
