// Savollar banki testlari — saqlangan savollar, xatolar, global statistika.

import jwt from "jsonwebtoken";

process.env.BOT_TOKEN = "test-token";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://x/x";
process.env.PORT = "4611";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { prisma } = await import("../src/db.js");
await import("../src/index.js");
await new Promise((r) => setTimeout(r, 400));

const BASE = "http://localhost:4611";
let pass = 0,
  fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log("  OK  " + name);
  } else {
    fail++;
    console.log("  FAIL " + name);
  }
}
function tokenFor(u) {
  return jwt.sign(
    { sub: u.id, telegramId: String(u.telegramId), role: u.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}
async function req(method, path, { user, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Authorization = "Bearer " + tokenFor(user);
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const userA = await prisma.user.create({ data: { id: 1, telegramId: 1n, name: "A" } });
const userB = await prisma.user.create({ data: { id: 2, telegramId: 2n, name: "B" } });

console.log("=== Saqlangan savollar ===");
{
  const r = await req("POST", "/api/questions/saved", {
    user: userA,
    body: { questionId: "t1-1" },
  });
  check("savol saqlandi", r.status === 201);

  // Ikki marta bosish — dublikat emas, xato ham emas (idempotent).
  // Foydalanuvchi tugmani ikki marta bossa ilova buzilmasligi kerak.
  const again = await req("POST", "/api/questions/saved", {
    user: userA,
    body: { questionId: "t1-1" },
  });
  check("qayta saqlash xato bermadi", again.status === 201);

  const rows = await prisma.savedQuestion.findMany({ where: { userId: userA.id } });
  check("dublikat yaratilmadi", rows.length === 1);

  const list = await req("GET", "/api/questions/saved", { user: userA });
  check("ro'yxatda ko'rinadi", list.json.saved.length === 1);

  // IZOLYATSIYA: boshqa foydalanuvchi buni ko'rmasligi kerak
  const other = await req("GET", "/api/questions/saved", { user: userB });
  check("boshqa foydalanuvchida ko'rinmaydi", other.json.saved.length === 0);

  const del = await req("DELETE", "/api/questions/saved/t1-1", { user: userA });
  check("olib tashlandi", del.status === 200);
  const after = await req("GET", "/api/questions/saved", { user: userA });
  check("ro'yxat bo'shadi", after.json.saved.length === 0);

  const bad = await req("POST", "/api/questions/saved", { user: userA, body: {} });
  check("bo'sh ID rad etildi", bad.status === 400);
}

console.log("\n=== Javoblarni yozish ===");
{
  const r = await req("POST", "/api/questions/answers", {
    user: userA,
    body: {
      answers: [
        { questionId: "t1-1", isCorrect: false },
        { questionId: "t1-2", isCorrect: true },
        { questionId: "t1-3", isCorrect: false },
      ],
    },
  });
  check("javoblar yozildi", r.status === 200 && r.json.recorded === 3);

  const mine = await req("GET", "/api/questions/mistakes", { user: userA });
  check("faqat xatolar saqlandi (2 ta)", mine.json.mistakes.length === 2);

  const stats = await prisma.questionStat.findMany({});
  check("global statistika 3 savol uchun", stats.length === 3);
  const s1 = stats.find((x) => x.questionId === "t1-1");
  check("t1-1: 1 urinish, 1 xato", s1.totalCount === 1 && s1.wrongCount === 1);
  const s2 = stats.find((x) => x.questionId === "t1-2");
  check("t1-2: 1 urinish, 0 xato", s2.totalCount === 1 && s2.wrongCount === 0);
}

console.log("\n=== Xatoni tuzatish (resolved) ===");
{
  // Endi t1-1 ga TO'G'RI javob beriladi — ro'yxatdan chiqishi kerak.
  await req("POST", "/api/questions/answers", {
    user: userA,
    body: { answers: [{ questionId: "t1-1", isCorrect: true }] },
  });
  const mine = await req("GET", "/api/questions/mistakes", { user: userA });
  check("tuzatilgan xato ro'yxatdan chiqdi", !mine.json.mistakes.some((m) => m.questionId === "t1-1"));

  // Yozuv O'CHIRILMAYDI — tarix saqlanadi
  const row = await prisma.questionMistake.findFirst({
    where: { userId: userA.id, questionId: "t1-1" },
  });
  check("yozuv o'chirilmadi, resolvedAt belgilandi", row && row.resolvedAt != null);

  // Qayta xato qilinsa — ro'yxatga QAYTADI. Aks holda foydalanuvchi uni
  // ko'rmasdi va takrorlay olmasdi.
  await req("POST", "/api/questions/answers", {
    user: userA,
    body: { answers: [{ questionId: "t1-1", isCorrect: false }] },
  });
  const again = await req("GET", "/api/questions/mistakes", { user: userA });
  check("qayta xato ro'yxatga qaytdi", again.json.mistakes.some((m) => m.questionId === "t1-1"));
  const row2 = await prisma.questionMistake.findFirst({
    where: { userId: userA.id, questionId: "t1-1" },
  });
  check("wrongCount oshdi", row2.wrongCount >= 2);
}

console.log("\n=== Takroriy savol bir urinishda ===");
{
  // Bir savol ikki marta yuborilsa, statistika IKKI marta oshmasligi kerak.
  const before = await prisma.questionStat.findUnique({ where: { questionId: "t9-9" } });
  await req("POST", "/api/questions/answers", {
    user: userB,
    body: {
      answers: [
        { questionId: "t9-9", isCorrect: false },
        { questionId: "t9-9", isCorrect: false },
      ],
    },
  });
  const after = await prisma.questionStat.findUnique({ where: { questionId: "t9-9" } });
  check("takroriy savol bir marta hisoblandi", after.totalCount === 1);
  check("before bo'sh edi", before == null);
}

console.log("\n=== Qiyin savollar (global) ===");
{
  // minAttempts chegarasi: kam ishlangan savol ro'yxatga tushmasligi kerak,
  // aks holda 1 marta xato qilingan savol 100% bilan birinchi turardi.
  const r = await req("GET", "/api/questions/hardest", { user: userA });
  check("so'rov ishladi", r.status === 200);
  check(
    "kam urinishli savollar chiqarilmadi",
    r.json.questions.every((q) => q.totalCount >= 5)
  );

  // 5 urinishli savol yaratamiz
  for (let i = 0; i < 5; i++) {
    await req("POST", "/api/questions/answers", {
      user: i % 2 === 0 ? userA : userB,
      body: { answers: [{ questionId: "t5-5", isCorrect: i === 0 }] },
    });
  }
  const r2 = await req("GET", "/api/questions/hardest", { user: userA });
  const found = r2.json.questions.find((q) => q.questionId === "t5-5");
  check("yetarli urinishli savol chiqdi", Boolean(found));
  check("xato foizi hisoblandi (80%)", found && found.wrongPct === 80);
}

console.log("\n=== Autentifikatsiya ===");
{
  const noAuth = await req("GET", "/api/questions/saved", {});
  check("tokensiz rad etildi", noAuth.status === 401);
}

console.log("\n=== Chalg'ituvchi testlar ===");
{
  // Ma'lumot yetarli bo'lmasa bo'sh qaytishi kerak (xato emas).
  const empty = await req("GET", "/api/questions/tricky", { user: userB });
  check("ma'lumot yetmasa bo'sh ro'yxat", empty.status === 200 && Array.isArray(empty.json.questionIds));

  // 40%+ xato foizli savol yaratamiz: 5 urinish, 4 xato = 80%
  for (let i = 0; i < 5; i++) {
    await req("POST", "/api/questions/answers", {
      user: i % 2 === 0 ? userA : userB,
      body: { answers: [{ questionId: "tricky-1", isCorrect: i === 4 }] },
    });
  }
  // Oson savol: 5 urinish, 1 xato = 20% — chalg'ituvchi EMAS
  for (let i = 0; i < 5; i++) {
    await req("POST", "/api/questions/answers", {
      user: userA,
      body: { answers: [{ questionId: "easy-1", isCorrect: i !== 0 }] },
    });
  }

  const r = await req("GET", "/api/questions/tricky", { user: userA });
  check("so'rov ishladi", r.status === 200);
  check("80% xatoli savol ro'yxatda", r.json.questionIds.includes("tricky-1"));
  // MUHIM: 20% xatoli savol chiqmasligi kerak — u chalg'ituvchi emas,
  // ba'zilar shunchaki e'tiborsiz javob bergan.
  check("20% xatoli savol ro'yxatda YO'Q", !r.json.questionIds.includes("easy-1"));
}

console.log("\n=== Referral (do'stlarni taklif qilish) ===");
{
  // BO'SHLIQ EDI: referral tizimi bazada ishlab turgan edi, lekin
  // foydalanuvchi o'z kodini hech qayerdan ko'ra olmasdi — endpoint yo'q edi.
  const r = await req("GET", "/api/stats/referral", { user: userA });
  check("so'rov ishladi", r.status === 200);
  check("kod berildi", typeof r.json.code === "string" && r.json.code.length > 0);
  check("taklif soni raqam", typeof r.json.invitedCount === "number");
  check("ro'yxat massiv", Array.isArray(r.json.invited));

  // Kod BAZAGA saqlanishi kerak — har chaqiruvda yangi kod berilmasin,
  // aks holda foydalanuvchi tarqatgan kod ishlamay qolardi.
  const again = await req("GET", "/api/stats/referral", { user: userA });
  check("kod o'zgarmadi (barqaror)", again.json.code === r.json.code);

  // Autentifikatsiya talab qilinadi
  const noAuth = await req("GET", "/api/stats/referral", {});
  check("tokensiz rad etildi", noAuth.status === 401);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
