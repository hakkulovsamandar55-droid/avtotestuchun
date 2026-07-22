import { prisma } from "../db.js";
import { startOfLocalDay, startOfLocalMonth, startOfLocalWeek } from "../lib/time.js";

// ============================================================================
// RASMIY IMTIHON REYTINGI
//
// MAXFIYLIK:
//   - Faqat showOnLeaderboard = true bo'lgan foydalanuvchilar ko'rinadi
//   - Ismlar qisqartiriladi ("Aziz Karimov" -> "Aziz K.")
//   - Telegram ID, username va boshqa shaxsiy ma'lumot HECH QACHON
//     ommaviy reyting javobida yuborilmaydi
//
// KENGAYTIRILUVCHANLIK:
//   Davrlar (period) va tartiblash (sort) turlari jadval sifatida
//   belgilangan. Haftalik reyting qo'shish uchun faqat PERIODS ga bitta
//   qator qo'shish kifoya — qolgan kod o'zgarmaydi.
// ============================================================================

// Davrlar. Yangi davr qo'shish = shu yerga bitta qator.
export const PERIODS = {
  all_time: { label: "all_time", since: () => null },
  this_month: { label: "this_month", since: () => startOfLocalMonth() },
  // Haftalik allaqachon tayyor — faqat frontend'da ko'rsatish kerak bo'lganda
  // ochiladi (arxitektura o'zgartirilmaydi).
  this_week: { label: "this_week", since: () => startOfLocalWeek() },
  today: { label: "today", since: () => startOfLocalDay() },
};

// Tartiblash turlari. Har biri Prisma orderBy massivini beradi.
//
// Barcha turlarda qo'shimcha mezonlar bor — teng natijalarni adolatli
// ajratish uchun (masalan bir xil ballda tezroq tugatgan yuqoriroq).
export const SORTS = {
  score: [
    { correctCount: "desc" },
    { durationSec: "asc" },
    { finishedAt: "asc" },
  ],
  speed: [
    { durationSec: "asc" },
    { correctCount: "desc" },
    { finishedAt: "asc" },
  ],
  accuracy: [
    { accuracyPct: "desc" },
    { durationSec: "asc" },
    { finishedAt: "asc" },
  ],
};

export const DEFAULT_PERIOD = "all_time";
export const DEFAULT_SORT = "score";

/**
 * Ismni qisqartiradi: "Aziz Karimov" -> "Aziz K."
 *
 * Reytingda to'liq familiya ko'rsatilmaydi — foydalanuvchilar bir-birini
 * tanib qolishi mumkin bo'lsa ham, shaxsni to'liq aniqlash qiyinlashadi.
 */
export function shortenName(fullName) {
  const name = (fullName || "").trim();
  if (!name) return "Foydalanuvchi";

  const parts = name.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 20);

  const first = parts[0].slice(0, 20);
  const lastInitial = parts[parts.length - 1][0];
  return `${first} ${lastInitial.toUpperCase()}.`;
}

/**
 * Reytingni qaytaradi.
 *
 * MUHIM: faqat O'TGAN (passed) imtihonlar reytingga kiradi — yiqilgan
 * imtihonni "eng tez" deb ko'rsatish mantiqsiz bo'lardi (javob bermasdan
 * yugurib chiqish eng tez natija bo'lib qolardi).
 */
export async function getLeaderboard({
  period = DEFAULT_PERIOD,
  sort = DEFAULT_SORT,
  limit = 50,
  currentUserId = null,
} = {}) {
  const periodConfig = PERIODS[period] || PERIODS[DEFAULT_PERIOD];
  const orderBy = SORTS[sort] || SORTS[DEFAULT_SORT];
  const since = periodConfig.since();

  const where = {
    status: "COMPLETED",
    passed: true,
    ...(since ? { finishedAt: { gte: since } } : {}),
    // Maxfiylik: reytingdan chiqishni tanlagan foydalanuvchilar umuman
    // qatnashmaydi (o'zlari uchun ham ko'rinmaydi)
    user: { showOnLeaderboard: true, isBlocked: false },
  };

  // Har bir foydalanuvchining ENG YAXSHI natijasi olinishi kerak, aks holda
  // ko'p imtihon topshirgan odam ro'yxatni to'ldirib yuborardi.
  // Prisma `distinct` orderBy bilan birga ishlaydi: tartiblangan ro'yxatdan
  // har bir userId uchun birinchisini oladi.
  const rows = await prisma.examAttempt.findMany({
    where,
    orderBy,
    distinct: ["userId"],
    take: limit,
    select: {
      id: true,
      userId: true,
      correctCount: true,
      accuracyPct: true,
      durationSec: true,
      finishedAt: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  const entries = rows.map((row, i) => ({
    rank: i + 1,
    displayName: shortenName(row.user.name),
    avatarUrl: row.user.avatarUrl || null,
    correctCount: row.correctCount,
    accuracyPct: row.accuracyPct,
    durationSec: row.durationSec,
    finishedAt: row.finishedAt,
    isCurrentUser: currentUserId != null && row.userId === currentUserId,
  }));

  // Joriy foydalanuvchi ro'yxatga kirmagan bo'lsa ham, o'z o'rnini
  // ko'rishi kerak ("siz 127-o'rindasiz") — motivatsiya uchun muhim.
  const currentUserEntry = await getCurrentUserStanding({
    currentUserId,
    where,
    orderBy,
    alreadyInList: entries.some((e) => e.isCurrentUser),
  });

  return { period, sort, entries, currentUser: currentUserEntry };
}

async function getCurrentUserStanding({ currentUserId, where, orderBy, alreadyInList }) {
  if (!currentUserId || alreadyInList) return null;

  const user = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { name: true, showOnLeaderboard: true },
  });

  // Reytingdan chiqishni tanlagan bo'lsa, o'z o'rnini ham ko'rsatmaymiz
  if (!user?.showOnLeaderboard) return null;

  const best = await prisma.examAttempt.findFirst({
    where: { ...where, userId: currentUserId },
    orderBy,
    select: { correctCount: true, accuracyPct: true, durationSec: true, finishedAt: true },
  });

  if (!best) return null;

  // Aniq o'rinni hisoblash uchun "mendan yaxshiroq nechta natija bor" ni
  // sanaymiz. Tartiblash mezoni bo'yicha taqqoslash kerak, shuning uchun
  // sort turiga qarab shart o'zgaradi.
  const betterCondition = buildBetterThanCondition(orderBy, best);

  const betterCount = await prisma.examAttempt.count({
    where: { ...where, ...betterCondition },
  });

  return {
    rank: betterCount + 1,
    displayName: shortenName(user.name),
    correctCount: best.correctCount,
    accuracyPct: best.accuracyPct,
    durationSec: best.durationSec,
    finishedAt: best.finishedAt,
    isCurrentUser: true,
    outsideTopList: true,
  };
}

// Tartiblashning BIRINCHI mezoni bo'yicha "mendan yaxshiroq" shartini quradi.
// Bu taxminiy o'rin (teng natijalar bir xil o'rin oladi), lekin
// foydalanuvchiga ko'rsatish uchun yetarli va arzon.
function buildBetterThanCondition(orderBy, best) {
  const primary = orderBy[0];
  const [field, direction] = Object.entries(primary)[0];
  const value = best[field];

  if (value == null) return {};
  return { [field]: direction === "desc" ? { gt: value } : { lt: value } };
}

/** Sozlamalardagi "Reytingda ko'rsatilsin" tugmasi. */
export async function setLeaderboardVisibility(userId, visible) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { showOnLeaderboard: Boolean(visible) },
    select: { showOnLeaderboard: true },
  });
  return user;
}
