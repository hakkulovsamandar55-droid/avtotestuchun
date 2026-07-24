// REGRESSION TESTLARI — bu yerdagi har bir test AYNAN bitta topilgan xatoni
// qoplaydi. Tuzatishdan oldin bu testlar YIQILARDI.
//
// Har bir blokda xato tavsifi izohda keltirilgan, chunki test nomi o'zi
// "nima uchun bu muhim"ligini to'liq tushuntira olmaydi.

import jwt from "jsonwebtoken";

process.env.BOT_TOKEN = "test-token";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://x/x";
process.env.PORT = "4602";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { prisma } = await import("../src/db.js");
await import("../src/index.js");
await new Promise((r) => setTimeout(r, 400));

const BASE = "http://localhost:4602";
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

function tokenFor(user) {
  return jwt.sign(
    { sub: user.id, telegramId: String(user.telegramId), role: user.role },
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

// ---- Seed ----
const ceo = await prisma.user.create({
  data: { id: 1, telegramId: 1n, name: "CEO", role: "ADMIN" },
});
const owner = await prisma.user.create({ data: { id: 2, telegramId: 2n, name: "Owner" } });
const teacherNoGroup = await prisma.user.create({
  data: { id: 3, telegramId: 3n, name: "Teacher NoGroup" },
});
const teacherA = await prisma.user.create({ data: { id: 4, telegramId: 4n, name: "Teacher A" } });
const studentNoGroup = await prisma.user.create({
  data: { id: 5, telegramId: 5n, name: "Student NoGroup" },
});
const studentA = await prisma.user.create({ data: { id: 6, telegramId: 6n, name: "Student A" } });
const joiner = await prisma.user.create({ data: { id: 7, telegramId: 7n, name: "Joiner" } });
const owner2 = await prisma.user.create({ data: { id: 8, telegramId: 8n, name: "Owner2" } });

// Maktab 1
const s1 = await req("POST", "/api/school/admin/schools", {
  user: ceo,
  body: { name: "Maktab 1", ownerUserId: owner.id },
});
const school1Id = s1.json.school.id;
await req("PATCH", `/api/school/admin/schools/${school1Id}/status`, {
  user: ceo,
  body: { status: "ACTIVE" },
});

// Maktab 2 (izolyatsiyani sinash uchun)
const s2 = await req("POST", "/api/school/admin/schools", {
  user: ceo,
  body: { name: "Maktab 2", ownerUserId: owner2.id },
});
const school2Id = s2.json.school.id;
await req("PATCH", `/api/school/admin/schools/${school2Id}/status`, {
  user: ceo,
  body: { status: "ACTIVE" },
});

// Maktab 1 da guruh
const gA = await req("POST", `/api/school/${school1Id}/groups`, {
  user: owner,
  body: { name: "Guruh A" },
});
const groupAId = gA.json.group.id;

// Maktab 2 da guruh (cross-school test uchun)
const gX = await req("POST", `/api/school/${school2Id}/groups`, {
  user: owner2,
  body: { name: "Guruh X" },
});
const groupXId = gX.json.group.id;

// O'qituvchilar
await req("POST", `/api/school/${school1Id}/teachers`, {
  user: owner,
  body: { userId: teacherNoGroup.id },
});
const tA = await req("POST", `/api/school/${school1Id}/teachers`, {
  user: owner,
  body: { userId: teacherA.id },
});
// O'qituvchini guruhga tayinlash — students/:membershipId/group route'i
// membership turidan qat'i nazar ishlaydi (Owner huquqi bilan).
await req("PATCH", `/api/school/${school1Id}/members/${tA.json.membership.id}/group`, {
  user: owner,
  body: { groupId: groupAId },
});

// Talabalar: biri guruhli, biri guruhsiz
await prisma.membership.create({
  data: { userId: studentA.id, schoolId: school1Id, groupId: groupAId, role: "STUDENT", status: "ACTIVE" },
});
await prisma.membership.create({
  data: { userId: studentNoGroup.id, schoolId: school1Id, groupId: null, role: "STUDENT", status: "ACTIVE" },
});

console.log("\n=== XATO 1: guruhsiz o'qituvchi guruhsiz talabalarni ko'rardi ===");
{
  // XATO EDI: `where.groupId = req.membership.groupId` -> null bo'lib,
  // Prisma buni "groupId IS NULL" deb tushunardi va guruhga tayinlanmagan
  // BARCHA talabalarni qaytarardi.
  const { status, json } = await req("GET", `/api/school/${school1Id}/students`, {
    user: teacherNoGroup,
  });
  check("200 qaytdi", status === 200);
  check("bo'sh ro'yxat (ma'lumot oqishi yo'q)", (json.students || []).length === 0);
}

console.log("\n=== XATO 2: o'qituvchi ?groupId= bilan chegaradan chiqardi ===");
{
  // XATO EDI: `if (req.query.groupId) where.groupId = Number(...)` teacher
  // filtridan KEYIN turardi va uni bekor qilardi.
  const { status, json } = await req(
    "GET",
    `/api/school/${school1Id}/students?groupId=${groupAId}`,
    { user: teacherNoGroup }
  );
  check("200 qaytdi", status === 200);
  check("query bilan ham bo'sh (override ishlamaydi)", (json.students || []).length === 0);
}

console.log("\n=== XATO 3: cross-school guruh ID orqali ma'lumot o'qish ===");
{
  // XATO EDI: guruh shu maktabga tegishliligi tekshirilmasdi. Owner boshqa
  // maktabning guruh ID sini yozib, o'zga maktab homeworklarini ko'rardi.
  const { status } = await req("GET", `/api/school/${school1Id}/groups/${groupXId}/homework`, {
    user: owner,
  });
  check("404 qaytdi (boshqa maktab guruhi)", status === 404);

  const lb = await req("GET", `/api/school/${school1Id}/groups/${groupXId}/leaderboard`, {
    user: owner,
  });
  check("leaderboard ham 404", lb.status === 404);
}

console.log("\n=== XATO 4: groupId matn/son taqqoslash (taklif kodi) ===");
{
  // XATO EDI: frontend <select> "3" (matn) yuboradi. Backend
  // `Number(groupId) !== req.membership.groupId` bilan solishtirardi —
  // konvertatsiya bo'lgan, lekin groupId keyin xom holda service'ga
  // uzatilardi. Endi bir marta konvertatsiya qilinadi.
  const { status, json } = await req("POST", `/api/school/${school1Id}/invitations`, {
    user: teacherA,
    body: { type: "GROUP", groupId: String(groupAId) }, // MATN sifatida
  });
  check("201 qaytdi (matn groupId qabul qilindi)", status === 201);
  check("groupId SON sifatida saqlandi", json.invitation.groupId === groupAId);
}

console.log("\n=== XATO 5: guruhsiz o'qituvchi kod yarata olardi ===");
{
  const { status } = await req("POST", `/api/school/${school1Id}/invitations`, {
    user: teacherNoGroup,
    body: { type: "SCHOOL" },
  });
  check("403 qaytdi", status === 403);
}

console.log("\n=== XATO 6: maxUses=0 'cheksiz' bo'lib qolardi ===");
{
  // XATO EDI: `maxUses ? Number(maxUses) : null` — 0 falsy, shuning uchun
  // null bo'lib ketardi, ya'ni CHEKSIZ kod. Bu biznes uchun xavfli.
  const { status } = await req("POST", `/api/school/${school1Id}/invitations`, {
    user: owner,
    body: { type: "SCHOOL", maxUses: 0 },
  });
  check("400 qaytdi (0 rad etildi)", status === 400);
}

console.log("\n=== XATO 7: taklif kodi limiti atomik emas edi ===");
{
  const inv = await req("POST", `/api/school/${school1Id}/invitations`, {
    user: owner,
    body: { type: "SCHOOL", maxUses: 1 },
  });
  const code = inv.json.invitation.code;

  const first = await req("POST", "/api/school/join", { user: joiner, body: { code } });
  check("birinchi qo'shilish muvaffaqiyatli", first.status === 200 || first.status === 201);

  // Limit tugagan — ikkinchi urinish rad etilishi kerak
  const second = await req("POST", "/api/school/join", { user: studentA, body: { code } });
  check("ikkinchi urinish rad etildi (limit)", second.status >= 400);
}

console.log("\n=== XATO 8: minScore bo'sh bo'lsa 0 bo'lib saqlanardi ===");
{
  // XATO EDI: `minScore != null ? Number(minScore) : null` — "" uchun
  // Number("") === 0, ya'ni "minimal ball 0" saqlanardi.
  const { status, json } = await req("POST", `/api/school/${school1Id}/groups/${groupAId}/homework`, {
    user: owner,
    body: {
      title: "Uy vazifasi",
      type: "TICKETS",
      params: { ticketId: 1 },
      minScore: "",
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    },
  });
  check("201 qaytdi", status === 201);
  check("minScore null (0 emas)", json.homework.minScore === null);
}

console.log("\n=== XATO 9: minScore diapazoni tekshirilmasdi ===");
{
  const { status } = await req("POST", `/api/school/${school1Id}/groups/${groupAId}/homework`, {
    user: owner,
    body: {
      title: "Xato",
      type: "TICKETS",
      params: { ticketId: 1 },
      minScore: 150,
      deadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    },
  });
  check("400 qaytdi (100 dan katta)", status === 400);
}

console.log("\n=== XATO 10: teacher dashboard guruhsiz o'qituvchida yiqilardi ===");
{
  // XATO EDI: `req.membership.groupId` null -> `!groupId` sharti 400
  // berardi, lekin xabar "Guruh tanlanmagan" bo'lib, o'qituvchi nima
  // qilishni tushunmasdi. Endi 409 + aniq xabar.
  const { status } = await req("GET", `/api/school/${school1Id}/teacher/dashboard`, {
    user: teacherNoGroup,
  });
  check("409 qaytdi (aniq holat kodi)", status === 409);
}

console.log("\n=== XATO 11: kuchli/kuchsiz talabalar ro'yxati kesishardi ===");
{
  // XATO EDI: slice(0,5) va slice(-5) — 5 talabali guruhda AYNAN bir xil
  // talabalar ikkala ro'yxatda ham chiqardi.
  const { status, json } = await req("GET", `/api/school/${school1Id}/teacher/dashboard`, {
    user: teacherA,
  });
  check("200 qaytdi", status === 200);
  const weakIds = new Set((json.weakStudents || []).map((s) => s.userId));
  const strongIds = (json.strongStudents || []).map((s) => s.userId);
  const overlap = strongIds.filter((id) => weakIds.has(id));
  check("ro'yxatlar kesishmaydi", overlap.length === 0);
}

console.log("\n=== XATO 12: log xatosi asosiy amalni buzardi ===");
{
  // XATO EDI: logActivity() tranzaksiyadan keyin chaqirilardi va xato
  // tashlasa, maktab YARATILGAN bo'lsa ham foydalanuvchi 500 ko'rardi.
  // safeLog() endi buni yutadi. Bu yerda log jadvalini buzib sinaymiz.
  const original = prisma.activityLog.create;
  prisma.activityLog.create = async () => {
    throw new Error("log jadvali ishlamayapti");
  };

  // MUHIM: yangi foydalanuvchi kerak. `joiner` yuqoridagi XATO 7 testida
  // allaqachon maktabga qo'shilgan — uni owner qilishga urinish "bitta faol
  // a'zolik" qoidasi bo'yicha haqli ravishda rad etiladi va biz log xatosini
  // emas, boshqa narsani sinagan bo'lardik.
  const freshOwner = await prisma.user.create({
    data: { id: 99, telegramId: 99n, name: "Log Test Owner" },
  });

  const { status } = await req("POST", "/api/school/admin/schools", {
    user: ceo,
    body: { name: "Log Test Maktab", ownerUserId: freshOwner.id },
  });

  prisma.activityLog.create = original;
  check("201 qaytdi (log xatosiga qaramay)", status === 201);
}

console.log("\n=== XATO 13: Telegram ID kiritilsa 500 qaytardi ===");
{
  // XATO EDI: User.id — INT4 (maks 2 147 483 647), Telegram ID esa 10+
  // xonali. Owner "5842067106" kiritganda Prisma
  // "Unable to fit integer value into INT4" bilan yiqilib, foydalanuvchi
  // "Server xatosi" ko'rardi. Endi aniq, tushunarli 400 qaytadi.
  const { status, json } = await req("POST", `/api/school/${school1Id}/teachers`, {
    user: owner,
    body: { userId: 5842067106 },
  });
  check("400 qaytdi (500 emas)", status === 400);
  check("xabar Telegram ID ni eslatadi", /Telegram/i.test(json?.error || ""));
}

console.log("\n=== YANGI: foydalanuvchi qidiruvi ===");
{
  // Qidiruv ID yodlash zaruratini yo'q qiladi.
  const free = await prisma.user.create({
    data: { id: 101, telegramId: 5842067106n, name: "Bo'sh Foydalanuvchi", username: "bosh_user" },
  });

  const byName = await req("GET", `/api/school/${school1Id}/search-users?q=Bo'sh`, {
    user: owner,
  });
  check("ism bo'yicha topildi", byName.status === 200 && byName.json.users.length === 1);

  const byUsername = await req("GET", `/api/school/${school1Id}/search-users?q=bosh_user`, {
    user: owner,
  });
  check("username bo'yicha topildi", byUsername.json.users.length === 1);

  // Telegram ID bo'yicha ham topilishi kerak — foydalanuvchi baribir uni
  // kiritishga urinadi, endi bu ISHLAYDI (xato o'rniga).
  const byTgId = await req("GET", `/api/school/${school1Id}/search-users?q=5842067106`, {
    user: owner,
  });
  check("Telegram ID bo'yicha topildi", byTgId.json.users.length === 1);

  check(
    "telegramId matn sifatida qaytdi (BigInt JSON xatosi yo'q)",
    typeof byTgId.json.users[0].telegramId === "string"
  );

  // Allaqachon a'zo bo'lganlar chiqmasligi kerak — "tanladim, xato chiqdi"
  // holatini oldini oladi.
  const taken = await req("GET", `/api/school/${school1Id}/search-users?q=Teacher A`, {
    user: owner,
  });
  check("a'zo bo'lgan foydalanuvchi ro'yxatda yo'q", taken.json.users.length === 0);

  const short = await req("GET", `/api/school/${school1Id}/search-users?q=B`, { user: owner });
  check("1 belgili so'rov bo'sh qaytardi", short.json.users.length === 0);

  // Endi shu topilgan foydalanuvchini haqiqatan qo'sha olamizmi
  const added = await req("POST", `/api/school/${school1Id}/teachers`, {
    user: owner,
    body: { userId: free.id },
  });
  check("qidiruvdan topilgan foydalanuvchi qo'shildi", added.status === 201);
}

console.log("\n=== YANGI: talaba profili (o'qituvchi paneli) ===");
{
  // Talaba profili — o'qituvchi uchun asosiy vosita. Xavfsizlik eng muhim:
  // o'qituvchi FAQAT o'z guruhi talabasini ko'rishi kerak.
  const studentAMembership = await prisma.membership.findFirst({
    where: { userId: studentA.id, status: "ACTIVE" },
  });

  const ok = await req(
    "GET",
    `/api/school/${school1Id}/students/${studentAMembership.id}/profile`,
    { user: teacherA }
  );
  check("o'qituvchi o'z guruhi talabasini ko'ra oldi", ok.status === 200);
  check("profil ma'lumotlari to'liq", Boolean(ok.json?.student && ok.json?.period && ok.json?.daily));
  check(
    "kunlik qator to'g'ri uzunlikda (bo'sh kunlar ham bor)",
    Array.isArray(ok.json.daily) && ok.json.daily.length === 14
  );

  // Guruhsiz o'qituvchi hech kimni ko'rmasligi kerak
  const noGroup = await req(
    "GET",
    `/api/school/${school1Id}/students/${studentAMembership.id}/profile`,
    { user: teacherNoGroup }
  );
  check("guruhsiz o'qituvchi rad etildi", noGroup.status === 403);

  // Boshqa maktab owner'i ko'ra olmasligi kerak
  const crossSchool = await req(
    "GET",
    `/api/school/${school2Id}/students/${studentAMembership.id}/profile`,
    { user: owner2 }
  );
  check("boshqa maktab owner'i rad etildi", crossSchool.status === 404);

  // days parametri chegaralanadi (DB ni himoya qilish)
  const huge = await req(
    "GET",
    `/api/school/${school1Id}/students/${studentAMembership.id}/profile?days=9999`,
    { user: teacherA }
  );
  check("juda katta days chegaralandi", huge.json?.daily?.length === 90);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
