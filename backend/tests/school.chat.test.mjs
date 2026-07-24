// Maktab chati testlari — xavfsizlik va asosiy oqim.
//
// Chat eng nozik qism: bu yerdagi xato boshqa maktabning shaxsiy
// yozishuvlarini ochib berishi mumkin. Shuning uchun ruxsat tekshiruvlari
// alohida qamrab olingan.

import jwt from "jsonwebtoken";

process.env.BOT_TOKEN = "test-token";
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://x/x";
process.env.PORT = "4607";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { prisma } = await import("../src/db.js");
await import("../src/index.js");
await new Promise((r) => setTimeout(r, 900));

const BASE = "http://localhost:4607";
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
const teacher = await prisma.user.create({ data: { id: 3, telegramId: 3n, name: "Teacher" } });
const student = await prisma.user.create({ data: { id: 4, telegramId: 4n, name: "Student" } });
const otherStudent = await prisma.user.create({
  data: { id: 5, telegramId: 5n, name: "Other Student" },
});
const outsider = await prisma.user.create({ data: { id: 6, telegramId: 6n, name: "Outsider" } });
const owner2 = await prisma.user.create({ data: { id: 7, telegramId: 7n, name: "Owner2" } });

// Maktab 1
const s1 = await req("POST", "/api/school/admin/schools", {
  user: ceo,
  body: { name: "Maktab 1", ownerUserId: owner.id },
});
const schoolId = s1.json.school.id;
await req("PATCH", `/api/school/admin/schools/${schoolId}/status`, {
  user: ceo,
  body: { status: "ACTIVE" },
});

// Maktab 2 — izolyatsiyani sinash uchun
const s2 = await req("POST", "/api/school/admin/schools", {
  user: ceo,
  body: { name: "Maktab 2", ownerUserId: owner2.id },
});
const school2Id = s2.json.school.id;
await req("PATCH", `/api/school/admin/schools/${school2Id}/status`, {
  user: ceo,
  body: { status: "ACTIVE" },
});

// Guruh A
const gA = await req("POST", `/api/school/${schoolId}/groups`, {
  user: owner,
  body: { name: "Guruh A" },
});
const groupA = gA.json.group.id;

// Guruh B — boshqa guruh, aloqa bo'lmasligi kerak
const gB = await req("POST", `/api/school/${schoolId}/groups`, {
  user: owner,
  body: { name: "Guruh B" },
});
const groupB = gB.json.group.id;

// A'zoliklar
const teacherM = await prisma.membership.create({
  data: { userId: teacher.id, schoolId, groupId: groupA, role: "TEACHER", status: "ACTIVE" },
});
const studentM = await prisma.membership.create({
  data: { userId: student.id, schoolId, groupId: groupA, role: "STUDENT", status: "ACTIVE" },
});
const otherStudentM = await prisma.membership.create({
  data: { userId: otherStudent.id, schoolId, groupId: groupB, role: "STUDENT", status: "ACTIVE" },
});
const ownerM = await prisma.membership.findFirst({
  where: { userId: owner.id, role: "OWNER" },
});

console.log("=== Chat ochish va ruxsatlar ===");
let chatId;
{
  const created = await req("POST", `/api/school/${schoolId}/chats`, {
    user: teacher,
    body: { membershipId: studentM.id },
  });
  check("o'qituvchi o'z guruhi talabasi bilan chat ochdi", created.status === 201);
  chatId = created.json?.chat?.id;

  // Takroran ochilsa — YANGI chat emas, mavjudi qaytishi kerak
  const again = await req("POST", `/api/school/${schoolId}/chats`, {
    user: teacher,
    body: { membershipId: studentM.id },
  });
  check("takroriy ochish yangi chat yaratmadi", again.json?.chat?.id === chatId);

  // Boshqa guruh talabasi bilan — RAD ETILISHI kerak
  const crossGroup = await req("POST", `/api/school/${schoolId}/chats`, {
    user: teacher,
    body: { membershipId: otherStudentM.id },
  });
  check("boshqa guruh talabasi bilan chat rad etildi", crossGroup.status === 403);

  // Owner har kim bilan yozisha oladi
  const ownerChat = await req("POST", `/api/school/${schoolId}/chats`, {
    user: owner,
    body: { membershipId: otherStudentM.id },
  });
  check("owner istalgan talaba bilan chat ocha oldi", ownerChat.status === 201);

  // Maktab a'zosi bo'lmagan odam
  const noAccess = await req("POST", `/api/school/${schoolId}/chats`, {
    user: outsider,
    body: { membershipId: studentM.id },
  });
  check("begona foydalanuvchi rad etildi", noAccess.status === 403 || noAccess.status === 404);
}

console.log("\n=== Xabar yuborish ===");
{
  const sent = await req("POST", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: teacher,
    body: { text: "Salom, uy vazifasini bajardingmi?" },
  });
  check("xabar yuborildi", sent.status === 201);

  const chat = await prisma.schoolChat.findUnique({ where: { id: chatId } });
  check("talaba uchun o'qilmagan +1", chat.unreadForTeacher === 0 && chat.unreadForStudent === 1);
  check("oxirgi xabar matni saqlandi", Boolean(chat.lastMessageText));

  // Bo'sh xabar
  const empty = await req("POST", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: teacher,
    body: { text: "   " },
  });
  check("bo'sh xabar rad etildi", empty.status === 400);

  // Juda uzun xabar
  const tooLong = await req("POST", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: teacher,
    body: { text: "a".repeat(2001) },
  });
  check("juda uzun xabar rad etildi", tooLong.status === 400);

  // Talaba javob berdi
  const reply = await req("POST", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: student,
    body: { text: "Ha, bajardim" },
  });
  check("talaba javob yubordi", reply.status === 201);

  const after = await prisma.schoolChat.findUnique({ where: { id: chatId } });
  check("o'qituvchi uchun o'qilmagan +1", after.unreadForTeacher === 1);
}

console.log("\n=== Xabarlarni o'qish ===");
{
  const msgs = await req("GET", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: student,
  });
  check("xabarlar olindi", msgs.status === 200 && msgs.json.messages.length === 2);
  check(
    "eng eskisi birinchi (UI tartibi)",
    msgs.json.messages[0].text.startsWith("Salom")
  );

  // Boshqa guruh talabasi bu chatga kira olmaydi
  const intruder = await req("GET", `/api/school/${schoolId}/chats/${chatId}/messages`, {
    user: otherStudent,
  });
  check("begona talaba xabarlarni ko'ra olmadi", intruder.status === 403);

  // Boshqa maktab owner'i
  const crossSchool = await req("GET", `/api/school/${school2Id}/chats/${chatId}/messages`, {
    user: owner2,
  });
  check("boshqa maktab owner'i rad etildi", crossSchool.status === 404);
}

console.log("\n=== O'qilgan deb belgilash ===");
{
  await req("POST", `/api/school/${schoolId}/chats/${chatId}/read`, { user: teacher });
  const chat = await prisma.schoolChat.findUnique({ where: { id: chatId } });
  check("o'qituvchi hisoblagichi nolga tushdi", chat.unreadForTeacher === 0);
  check("talaba hisoblagichiga tegilmadi", chat.unreadForStudent === 1);

  // Idempotent — qayta chaqirish xavfsiz
  const again = await req("POST", `/api/school/${schoolId}/chats/${chatId}/read`, {
    user: teacher,
  });
  check("qayta o'qish xavfsiz", again.status === 200);
}

console.log("\n=== Chatlar ro'yxati ===");
{
  const list = await req("GET", `/api/school/${schoolId}/chats`, { user: teacher });
  check("ro'yxat olindi", list.status === 200 && list.json.chats.length >= 1);

  const chat = list.json.chats.find((c) => c.id === chatId);
  check("suhbatdosh ismi bor", chat?.other?.name === "Student");
  check("o'qilmaganlar soni bor", typeof chat?.unreadCount === "number");

  const unread = await req("GET", `/api/school/${schoolId}/chats/unread`, { user: student });
  check("jami o'qilmagan hisoblandi", unread.json.unread === 1);
}

console.log(`\n${pass} passed, ${fail} failed`);
// Server socket ochiq qolgani uchun process o'zi tugamaydi — aniq chiqamiz
process.exit(fail ? 1 : 0);
