import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { generateUniqueReferralCode } from "../services/referral.js";
import * as settingsSvc from "../services/settingsService.js";
import { CATEGORIES as SIGN_CATEGORIES } from "../../../shared/data/signsData.js";
import { TOTAL_TICKETS } from "../data/ticketsData.js";
// Kun chegarasi mahalliy vaqtga (UTC+5) ko'ra hisoblanadi — lib/time.js ga qarang.
import { localDayKey } from "../lib/time.js";
import { recordAttemptForHomework } from "../services/homeworkService.js";

export const statsRouter = Router();

// Ushbu bo'limdagi barcha endpointlar login qilingan foydalanuvchini talab qiladi
statsRouter.use(requireAuth, loadCurrentUser);


// POST /api/stats/attempt — bilet testi yoki imtihon yakunlanganda natijani saqlaydi
// POST /api/stats/signs-quiz  { correctCount, totalCount, category }
//
// Yo'l belgilari testining natijasi.
//
// NIMA UCHUN Attempt JADVALIGA YOZILMAYDI: Attempt jadvali haydovchilik
// imtihoni savollari uchun — undan `accuracy`, `solved`, `examReadiness`
// hisoblanadi. Belgilar testi boshqa narsani o'lchaydi (belgi tanish), uni
// shu jadvalga qo'shsak "imtihonga tayyorlik" foizi sun'iy ko'tarilib,
// foydalanuvchini chalg'itadi.
//
// Shuning uchun bu endpoint FAQAT uy vazifasi ilgagini ishga tushiradi:
// o'qituvchi "belgilarni o'rgan" vazifasini bergan bo'lsa, u yopiladi.
// Maktabga a'zo bo'lmagan foydalanuvchida hech narsa saqlanmaydi — belgilar
// testi ular uchun o'rganish vositasi, ball yig'ish emas.
statsRouter.post("/signs-quiz", asyncHandler(async (req, res) => {
  const { correctCount, totalCount, category } = req.body || {};

  if (
    !Number.isInteger(correctCount) ||
    !Number.isInteger(totalCount) ||
    totalCount <= 0 ||
    correctCount < 0 ||
    correctCount > totalCount
  ) {
    return res.status(400).json({ error: "correctCount/totalCount noto'g'ri" });
  }
  if (totalCount > 50) {
    return res.status(400).json({ error: "totalCount juda katta" });
  }
  if (category != null && !SIGN_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Noto'g'ri belgi toifasi" });
  }

  const scorePct = Math.round((correctCount / totalCount) * 100);

  const submission = await recordAttemptForHomework(req.user.id, {
    type: "SIGNS",
    score: scorePct,
    signsCategory: category ?? null,
  });

  res.json({ ok: true, scorePct, homeworkClosed: Boolean(submission) });
}));

statsRouter.post("/attempt", asyncHandler(async (req, res) => {
  const { type, ticketNumber, correctCount, totalCount, passed, durationSec } = req.body;

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

  // Test ishlash vaqti — ixtiyoriy (eski ilova versiyalari yubormaydi).
  //
  // YUQORI CHEGARA MUHIM: foydalanuvchi testni ochib qo'yib ketishi mumkin
  // (masalan telefonni yopib, ertasi kuni davom etishi). Bunday holatda
  // vaqt bir necha soat bo'lib chiqadi va "kunlik o'qish vaqti"
  // statistikasini butunlay buzadi. 2 soat (7200 s) real chegara —
  // undan oshsa yozmaymiz.
  let cleanDuration = null;
  if (durationSec != null) {
    const n = Number(durationSec);
    if (Number.isInteger(n) && n > 0 && n <= 7200) {
      cleanDuration = n;
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
      durationSec: cleanDuration,
    },
  });

  // Maktab modulining ilgagi: agar bu foydalanuvchi biror maktabga a'zo
  // bo'lib, shu turdagi tugallanmagan uy vazifasi bo'lsa, avtomatik
  // yakunlanadi. Xato tashlamaydi va asosiy oqimni bloklamaydi.
  const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  recordAttemptForHomework(req.user.id, {
    type: type === "TICKET" ? "TICKETS" : "PRACTICE",
    score: scorePct,
    attemptId: attempt.id,
    ticketNumber: type === "TICKET" ? ticketNumber : null,
  }).catch((err) => console.error("Homework hook (stats) xatosi:", err));

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
  const weeklyActivity = buildWeeklyActivity(dayCounts);

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
      totalAnswered: 0,
      weeklyActivity,
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
    totalAnswered,
    weeklyActivity,
    studyPlan,
  });
}));

/**
 * So'nggi 7 kunlik faollik — bosh sahifadagi haftalik ritm chizig'i uchun.
 *
 * MUHIM: natija HAR DOIM 7 element, dushanbadan boshlab emas, balki
 * "6 kun oldin -> bugun" tartibida. Sabab: foydalanuvchiga hafta boshi
 * qachon ekani emas, SO'NGGI 7 kun muhim — bugun o'ngdagi oxirgi katak
 * bo'lib turadi va ko'z shu yerga tushadi.
 *
 * Kunlar mahalliy vaqt bo'yicha guruhlanadi (APP_TZ_OFFSET_MINUTES),
 * aks holda kechqurun ishlagan test "ertaga" hisoblanib qolardi.
 */
function buildWeeklyActivity(dayCounts) {
  const out = [];
  const todayKey = localDayKey(new Date());

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = localDayKey(d);
    const count = dayCounts.get(key) || 0;
    out.push({
      date: key,
      count,
      active: count > 0,
      isToday: key === todayKey,
    });
  }
  return out;
}

// GET /api/stats/settings — ochiq (maxfiy bo'lmagan) global sozlamalar
//
// Frontend shundan biladi: global bepul rejim yoqilganmi, qaysi
// imkoniyat pullik, "Telegram" tugmasi qaysi havolaga olib boradi.
statsRouter.get("/settings", asyncHandler(async (_req, res) => {
  res.json(await settingsSvc.getPublicSettings());
}));

// GET /api/stats/referral — foydalanuvchining o'z taklif ma'lumoti
//
// NIMA UCHUN KERAK: referral tizimi bazada allaqachon ishlaydi (kod
// generatsiya qilinadi, ro'yxatdan o'tishda bog'lanadi), lekin foydalanuvchi
// o'z kodini HECH QAYERDAN ko'ra olmasdi — u faqat admin panelida
// ko'rinardi. Ya'ni funksiya bor, lekin unga yetib bo'lmaydi.
statsRouter.get("/referral", asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { referralCode: true },
  });

  // Kod hali yaratilmagan bo'lsa (eski hisoblar) — hozir yaratamiz.
  // Aks holda foydalanuvchi bo'sh ekran ko'rardi.
  let code = user?.referralCode;
  if (!code) {
    code = await generateUniqueReferralCode();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { referralCode: code },
    });
  }

  const invitedCount = await prisma.user.count({
    where: { referredById: req.user.id },
  });

  // Taklif qilinganlar ro'yxati — foydalanuvchi kimni chaqirganini ko'radi.
  // Faqat ism, boshqa shaxsiy ma'lumot berilmaydi.
  const invited = await prisma.user.findMany({
    where: { referredById: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { name: true, createdAt: true, isPremium: true },
  });

  // MUHIM TUZATISH: havola ilgari "https://t.me/BOT?start=ref_KOD" (bot
  // buyrug'i) formatida edi. Bu FORMAT XATO edi — Telegram bu formatda
  // botga oddiy CHATni ochadi, Mini App'ni EMAS. Foydalanuvchi botga
  // /start yozgandan keyin yana "Ilovani ochish" tugmasini bosishi kerak
  // bo'lardi, VA eng yomoni — bu holatda referral kodi Mini App'ga
  // umuman yetib bormasdi (bot.py static URL bilan tugma yuboradi,
  // koddan mustaqil). Natijada: "havolani bossam saytga kirmayapti".
  //
  // TO'G'RI FORMAT (rasmiy Telegram hujjati, core.telegram.org/bots/webapps
  // -> "Launching the main Mini App"):
  //   https://t.me/<bot_username>?startapp=<kod>
  // (Qisqa ilova nomi (/newapp) SHART EMAS — bu "Main Mini App" havolasi,
  // botning asosiy Menu Button'iga bog'langan Web App'ni bevosita ochadi.)
  //
  // Bu havola foydalanuvchini BEVOSITA Mini App'ga olib kiradi (bot
  // chatisiz, qo'shimcha tugmasiz) va Telegram o'zi start_param'ni
  // imzolangan initData ichiga qo'shadi — aynan shu narsani
  // telegramAuth.js allaqachon o'qiydi.
  //
  // SHART: BotFather'da botning "Main Mini App" (Bot Settings ->
  // Configure Mini App yoki Menu Button -> Web App sifatida sozlangan)
  // yoqilgan bo'lishi kerak — aks holda bu havola oddiy chatni ochadi.
  // Bot username ADMIN PANELIDAN olinadi (ENV — zaxira). Sabab: ilgari
  // faqat ENV dan o'qilardi, u serverda sozlanmagan bo'lsa link null
  // bo'lib, tugma umuman ko'rinmasdi va foydalanuvchi "referal ishlamayapti"
  // holatiga tushardi. Endi admin uni ilova ichidan kirita oladi.
  const settings = await settingsSvc.getSettings();
  const botUsername = settings.botUsername;
  const link = botUsername ? `https://t.me/${botUsername}?startapp=ref_${code}` : null;

  res.json({
    code,
    link,
    invitedCount,
    invited: invited.map((u) => ({
      name: u.name,
      joinedAt: u.createdAt,
      isPremium: u.isPremium,
    })),
  });
}));
