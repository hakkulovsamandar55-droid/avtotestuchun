// ============================================================================
// Mahalliy vaqt yordamchilari
//
// O'zbekiston UTC+5 da. `toISOString()` UTC beradi, shuning uchun uni
// to'g'ridan-to'g'ri ishlatish "kun" chegarasini 5 soatga siljitadi:
// mahalliy vaqt bilan ertalab soat 05:00 gacha bo'lgan faollik "kechagi kun"
// deb hisoblanardi. Bu streak hisobini ham, kunlik imtihon limitini ham
// buzadi.
//
// Shuning uchun kun chegarasi bilan ishlaydigan HAMMA joy (statistika,
// rasmiy imtihon limiti) shu fayldan foydalanadi — bitta manba.
// ============================================================================

export const TZ_OFFSET_MINUTES = Number(process.env.APP_TZ_OFFSET_MINUTES ?? 300); // +5:00

const OFFSET_MS = () => TZ_OFFSET_MINUTES * 60 * 1000;

/**
 * Sanani mahalliy kun kaliti ("2026-07-22") ga aylantiradi.
 * Streak va kunlik guruhlash uchun.
 */
export function localDayKey(date) {
  return new Date(date.getTime() + OFFSET_MS()).toISOString().slice(0, 10);
}

/**
 * Mahalliy kunning boshlanishini (00:00) UTC Date sifatida qaytaradi.
 *
 * Kunlik limitlarni tekshirish uchun: "bugun nechta imtihon topshirdi"
 * degan savol mahalliy yarim tundan boshlanadi, UTC yarim tundan emas.
 */
export function startOfLocalDay(reference = new Date()) {
  const shifted = new Date(reference.getTime() + OFFSET_MS());
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - OFFSET_MS());
}

/**
 * Mahalliy oyning boshlanishi — oylik leaderboard uchun.
 */
export function startOfLocalMonth(reference = new Date()) {
  const shifted = new Date(reference.getTime() + OFFSET_MS());
  shifted.setUTCDate(1);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - OFFSET_MS());
}

/**
 * Mahalliy haftaning boshlanishi (dushanba) — kelajakda haftalik
 * leaderboard qo'shilganda ishlatiladi. Arxitektura shunga tayyor
 * bo'lishi uchun oldindan yozildi.
 */
export function startOfLocalWeek(reference = new Date()) {
  const shifted = new Date(reference.getTime() + OFFSET_MS());
  const day = shifted.getUTCDay(); // 0 = yakshanba
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  shifted.setUTCDate(shifted.getUTCDate() - daysSinceMonday);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - OFFSET_MS());
}
