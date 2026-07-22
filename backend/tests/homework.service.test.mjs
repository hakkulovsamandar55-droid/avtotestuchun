const { prisma } = await import("../src/db.js");
const schoolSvc = await import("../src/services/schoolService.js");
const hwSvc = await import("../src/services/homeworkService.js");

let pass = 0, fail = 0;
function check(n, c) { if (c) { pass++; console.log("  OK  " + n); } else { fail++; console.log("  FAIL " + n); } }
async function checkThrows(n, code, fn) {
  try { await fn(); check(n, false); }
  catch (e) { check(n, e.code === code); if (e.code !== code) console.log("    (got: " + e.code + "/" + e.message + ")"); }
}

await prisma.user.create({ data: { id: 1, telegramId: 1n, name: "CEO", role: "ADMIN" } });
await prisma.user.create({ data: { id: 2, telegramId: 2n, name: "Owner" } });
await prisma.user.create({ data: { id: 3, telegramId: 3n, name: "Teacher" } });
await prisma.user.create({ data: { id: 4, telegramId: 4n, name: "Student A" } });
await prisma.user.create({ data: { id: 5, telegramId: 5n, name: "Student B" } });

const ceo = { id: 1, role: "ADMIN" };
const school = await schoolSvc.createSchool(ceo, { name: "Test maktab", ownerUserId: 2 });
await schoolSvc.setSchoolStatus(ceo, school.id, "ACTIVE");
const group = await schoolSvc.createGroup(school.id, "Guruh 1");

const inviteA = await schoolSvc.createInvitation(school.id, 2, { type: "GROUP", groupId: group.id });
const { membership: memA } = await schoolSvc.joinSchoolByCode({ id: 4 }, inviteA.code);
const inviteB = await schoolSvc.createInvitation(school.id, 2, { type: "GROUP", groupId: group.id });
const { membership: memB } = await schoolSvc.joinSchoolByCode({ id: 5 }, inviteB.code);

console.log("--- Homework yaratish ---");
const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const hw = await hwSvc.createHomework(school.id, group.id, 3, {
  title: "12-biletni yeching",
  type: "PRACTICE",
  minScore: 80,
  deadline,
});
check("homework yaratildi", hw && hw.title === "12-biletni yeching");

const submissionsA = await hwSvc.listMyHomework(memA.id);
check("Student A uchun avtomatik PENDING submission", submissionsA.length === 1 && submissionsA[0].status === "PENDING");
const submissionsB = await hwSvc.listMyHomework(memB.id);
check("Student B uchun ham", submissionsB.length === 1);

console.log("--- Yaroqsiz kirish rad etiladi ---");
await checkThrows("bo'sh sarlavha", "invalid_input", () =>
  hwSvc.createHomework(school.id, group.id, 3, { title: "", type: "PRACTICE", deadline }));
await checkThrows("noto'g'ri tur", "invalid_input", () =>
  hwSvc.createHomework(school.id, group.id, 3, { title: "x", type: "BOGUS", deadline }));
await checkThrows("o'tmishdagi muddat", "invalid_input", () =>
  hwSvc.createHomework(school.id, group.id, 3, { title: "x", type: "PRACTICE", deadline: "2020-01-01" }));
await checkThrows("boshqa maktab guruhi", "not_found", () =>
  hwSvc.createHomework(999, group.id, 3, { title: "x", type: "PRACTICE", deadline }));

console.log("--- Minimal balldan past natija yopmaydi ---");
const belowMin = await hwSvc.recordAttemptForHomework(4, { type: "PRACTICE", score: 60 });
check("60% < 80% -> hali PENDING", belowMin === null);
const stillPending = await hwSvc.listMyHomework(memA.id);
check("submission hali PENDING", stillPending[0].status === "PENDING");

console.log("--- Yetarli ball -> avtomatik COMPLETED ---");
const completed = await hwSvc.recordAttemptForHomework(4, { type: "PRACTICE", score: 90, attemptId: 501 });
check("submission qaytdi", completed !== null);
check("status COMPLETED", completed.status === "COMPLETED");
check("score saqlandi", completed.score === 90);
check("attemptId bog'landi", completed.attemptId === 501);

console.log("--- Mos kelmagan tur homeworkni yopmaydi ---");
const wrongType = await hwSvc.recordAttemptForHomework(5, { type: "OFFICIAL_EXAM", score: 100 });
check("PRACTICE homework OFFICIAL_EXAM bilan yopilmaydi", wrongType === null);
const stillPendingB = await hwSvc.listMyHomework(memB.id);
check("Student B submission hali PENDING", stillPendingB[0].status === "PENDING");

console.log("--- A'zo bo'lmagan foydalanuvchi uchun jim qaytadi (xato tashlamaydi) ---");
await prisma.user.create({ data: { id: 6, telegramId: 6n, name: "No school" } });
const noMember = await hwSvc.recordAttemptForHomework(6, { type: "PRACTICE", score: 100 });
check("null qaytdi, xato tashlamadi", noMember === null);

console.log("--- Muddati o'tgan homework LATE deb belgilanadi ---");
// Student B ning oldingi (12-bilet) submission'ini avval yopamiz, aks holda
// FIFO tartibida recordAttemptForHomework o'shani topib qoladi, yangisini emas.
await hwSvc.recordAttemptForHomework(5, { type: "PRACTICE", score: 90 });

const pastDeadline = new Date(Date.now() + 500).toISOString(); // 0.5 soniyadan keyin tugaydi
const hw2 = await hwSvc.createHomework(school.id, group.id, 3, {
  title: "Tezkor muddat",
  type: "PRACTICE",
  deadline: pastDeadline,
});
await new Promise((r) => setTimeout(r, 700));
const lateResult = await hwSvc.recordAttemptForHomework(5, { type: "PRACTICE", score: 100 });
check("LATE deb belgilandi", lateResult && lateResult.status === "LATE");

console.log("--- Guruh homework ro'yxati statistikasi bilan ---");
const groupHw = await hwSvc.listGroupHomework(group.id);
const first = groupHw.find((h) => h.id === hw.id);
check("stats.total to'g'ri", first.stats.total === 2);
check("stats.completed to'g'ri", first.stats.completed === 2);
check("params JSON parse qilingan", typeof first.params === "object");

console.log("--- Yangi talaba guruhga qo'shilganda ochiq homeworklarga yoziladi ---");
await prisma.user.create({ data: { id: 7, telegramId: 7n, name: "Student C" } });
const inviteC = await schoolSvc.createInvitation(school.id, 2, { type: "GROUP", groupId: group.id });
const { membership: memC } = await schoolSvc.joinSchoolByCode({ id: 7 }, inviteC.code);
await hwSvc.enrollMembershipInGroupHomeworks(memC.id, group.id);
const cSubs = await hwSvc.listMyHomework(memC.id);
check("Student C 12-bilet homeworkiga yozildi", cSubs.some((s) => s.homeworkId === hw.id));

console.log("--- expireOverdueSubmissions ---");
const hw3 = await hwSvc.createHomework(school.id, group.id, 3, {
  title: "Yana tezkor",
  type: "PRACTICE",
  deadline: new Date(Date.now() + 300).toISOString(),
});
await new Promise((r) => setTimeout(r, 500));
await hwSvc.expireOverdueSubmissions(group.id);
const hw3Subs = await prisma.homeworkSubmission.findMany({ where: { homeworkId: hw3.id } });
check("bajarilmagan submissionlar MISSED bo'ldi", hw3Subs.every((s) => s.status === "MISSED"));

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
