// Ruxsatlar chegarasini HTTP darajasida sinaydi — real Express ilovasi,
// lekin Prisma o'rniga xotiradagi fake (tests/run.mjs orqali almashtiriladi).
//
// Bu test qatlami muhim, chunki route middleware zanjiridagi xatolar
// (masalan noto'g'ri requireSchool chaqiruvi, yo'q joyda requireCeo) faqat
// servis darajasidagi unit testlarda ko'rinmaydi — ular route ulanishining
// o'zini tekshirmaydi.

import jwt from "jsonwebtoken";

process.env.BOT_TOKEN = "test-token";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://x/x";
process.env.PORT = "4601";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { prisma } = await import("../src/db.js");
await import("../src/index.js");
await new Promise((r) => setTimeout(r, 400));

const BASE = "http://localhost:4601";
let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log("  OK  " + name); }
  else { fail++; console.log("  FAIL " + name); }
}

function tokenFor(user) {
  return jwt.sign({ sub: user.id, telegramId: String(user.telegramId), role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
const ceoRow = await prisma.user.create({ data: { id: 1, telegramId: 1n, name: "CEO", role: "ADMIN" } });
const ownerRow = await prisma.user.create({ data: { id: 2, telegramId: 2n, name: "Owner" } });
const teacherARow = await prisma.user.create({ data: { id: 3, telegramId: 3n, name: "Teacher A" } });
const teacherBRow = await prisma.user.create({ data: { id: 4, telegramId: 4n, name: "Teacher B" } });
const studentARow = await prisma.user.create({ data: { id: 5, telegramId: 5n, name: "Student A" } });
const studentBRow = await prisma.user.create({ data: { id: 6, telegramId: 6n, name: "Student B" } });
const outsiderRow = await prisma.user.create({ data: { id: 7, telegramId: 7n, name: "Outsider" } });

console.log("--- CEO: maktab yaratish va tasdiqlash ---");
{
  const { status, json } = await req("POST", "/api/school/admin/schools", {
    user: ceoRow,
    body: { name: "Test Maktab", ownerUserId: 2 },
  });
  check("201 qaytdi", status === 201);
  check("PENDING holatida", json.school.status === "PENDING");

  const notCeo = await req("POST", "/api/school/admin/schools", {
    user: ownerRow,
    body: { name: "Ruxsatsiz", ownerUserId: 3 },
  });
  check("CEO bo'lmagan foydalanuvchi maktab yarata olmaydi", notCeo.status === 403);
}

const schoolId = (await prisma.school.findFirst({ where: {} })).id;
await req("PATCH", `/api/school/admin/schools/${schoolId}/status`, { user: ceoRow, body: { status: "ACTIVE" } });

console.log("--- Owner: 2 ta guruh, 2 ta o'qituvchi tayinlaydi ---");
const groupARes = await req("POST", `/api/school/${schoolId}/groups`, { user: ownerRow, body: { name: "Guruh A" } });
const groupBRes = await req("POST", `/api/school/${schoolId}/groups`, { user: ownerRow, body: { name: "Guruh B" } });
check("Guruh A yaratildi", groupARes.status === 201);
check("Guruh B yaratildi", groupBRes.status === 201);
const groupAId = groupARes.json.group.id;
const groupBId = groupBRes.json.group.id;

const teacherAJoin = await req("POST", `/api/school/${schoolId}/teachers`, { user: ownerRow, body: { userId: 3 } });
const teacherBJoin = await req("POST", `/api/school/${schoolId}/teachers`, { user: ownerRow, body: { userId: 4 } });
check("Teacher A tayinlandi", teacherAJoin.status === 201);
check("Teacher B tayinlandi", teacherBJoin.status === 201);

await prisma.membership.update({ where: { id: teacherAJoin.json.membership.id }, data: { groupId: groupAId } });
await prisma.membership.update({ where: { id: teacherBJoin.json.membership.id }, data: { groupId: groupBId } });

console.log("--- Talabalar guruhlarga qo'shiladi ---");
const inviteA = await req("POST", `/api/school/${schoolId}/invitations`, {
  user: ownerRow,
  body: { type: "GROUP", groupId: groupAId },
});
const inviteB = await req("POST", `/api/school/${schoolId}/invitations`, {
  user: ownerRow,
  body: { type: "GROUP", groupId: groupBId },
});

const joinA = await req("POST", "/api/school/join", { user: studentARow, body: { code: inviteA.json.invitation.code } });
const joinB = await req("POST", "/api/school/join", { user: studentBRow, body: { code: inviteB.json.invitation.code } });
check("Student A Guruh A ga qo'shildi", joinA.status === 201 && joinA.json.membership.groupId === groupAId);
check("Student B Guruh B ga qo'shildi", joinB.status === 201 && joinB.json.membership.groupId === groupBId);

console.log("--- KRITIK: Teacher A Guruh B talabalarini KO'RA OLMAYDI ---");
{
  const res = await req("GET", `/api/school/${schoolId}/students`, { user: teacherARow });
  check("200 qaytdi", res.status === 200);
  check("faqat o'z guruhi qaytadi", res.json.students.length === 1);
  check("Student A bor", res.json.students[0].user.name === "Student A");
  check("Student B YO'Q (boshqa guruh)", !res.json.students.some((s) => s.user.name === "Student B"));
}

console.log("--- Owner ikkala guruhni ham ko'radi ---");
{
  const res = await req("GET", `/api/school/${schoolId}/students`, { user: ownerRow });
  check("2 ta talaba", res.json.students.length === 2);
}

console.log("--- KRITIK: Teacher A boshqa guruhga homework bera olmaydi ---");
{
  const deadline = new Date(Date.now() + 86400000).toISOString();
  const res = await req("POST", `/api/school/${schoolId}/groups/${groupBId}/homework`, {
    user: teacherARow,
    body: { title: "Boshqa guruhga", type: "PRACTICE", deadline },
  });
  check("403 qaytdi", res.status === 403);
}

console.log("--- Teacher A o'z guruhiga homework bera oladi ---");
{
  const deadline = new Date(Date.now() + 86400000).toISOString();
  const res = await req("POST", `/api/school/${schoolId}/groups/${groupAId}/homework`, {
    user: teacherARow,
    body: { title: "12-bilet", type: "PRACTICE", deadline },
  });
  check("201 qaytdi", res.status === 201);
}

console.log("--- KRITIK: boshqa maktabga (yo'q) a'zo bo'lmagan CHET odam rad etiladi ---");
{
  const res = await req("GET", `/api/school/${schoolId}/students`, { user: outsiderRow });
  check("403 qaytdi", res.status === 403);
}

console.log("--- KRITIK: Talaba o'qituvchilar ro'yxatini ko'ra olmaydi (faqat Owner) ---");
{
  const res = await req("GET", `/api/school/${schoolId}/teachers`, { user: studentARow });
  check("403 qaytdi", res.status === 403);
}

console.log("--- Talaba o'z homeworklarini ko'radi ---");
{
  const res = await req("GET", "/api/school/my-homework", { user: studentARow });
  check("200 qaytdi", res.status === 200);
  check("1 ta homework", res.json.homework.length === 1);
}

console.log("--- CEO istalgan maktabga kira oladi (hatto a'zo bo'lmasa ham) ---");
{
  const res = await req("GET", `/api/school/${schoolId}/students`, { user: ceoRow });
  check("200 qaytdi", res.status === 200);
  check("hamma talaba ko'rinadi", res.json.students.length === 2);
}

console.log("--- GET /api/school/me ---");
{
  const res = await req("GET", "/api/school/me", { user: studentARow });
  check("membership qaytdi", res.json.membership !== null);
  check("school nomi to'g'ri", res.json.school.name === "Test Maktab");

  const noneRes = await req("GET", "/api/school/me", { user: outsiderRow });
  check("a'zo bo'lmagan uchun null", noneRes.json.membership === null);
}

console.log("--- Token yo'q bo'lsa hamma joy 401 ---");
{
  const res = await fetch(BASE + `/api/school/${schoolId}`);
  check("401", res.status === 401);
}

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
