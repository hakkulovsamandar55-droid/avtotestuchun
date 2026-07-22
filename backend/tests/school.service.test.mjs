const { prisma } = await import("../src/db.js");
const svc = await import("../src/services/schoolService.js");

let pass = 0, fail = 0;
function check(n, c) { if (c) { pass++; console.log("  OK  " + n); } else { fail++; console.log("  FAIL " + n); } }
async function checkThrows(n, code, fn) {
  try { await fn(); check(n, false); }
  catch (e) { check(n, e.code === code); if (e.code !== code) console.log("    (got: " + e.code + " / " + e.message + ")"); }
}

await prisma.user.create({ data: { id: 1, telegramId: 1n, name: "CEO Admin", role: "ADMIN" } });
await prisma.user.create({ data: { id: 2, telegramId: 2n, name: "Owner Aziz" } });
await prisma.user.create({ data: { id: 3, telegramId: 3n, name: "Teacher Bekzod" } });
await prisma.user.create({ data: { id: 4, telegramId: 4n, name: "Student Sardor" } });
await prisma.user.create({ data: { id: 5, telegramId: 5n, name: "Student Malika" } });

const ceo = { id: 1, role: "ADMIN" };

console.log("--- Maktab yaratish (CEO) ---");
const school = await svc.createSchool(ceo, { name: "  Tezlik Auto Maktab  ", ownerUserId: 2 });
check("maktab yaratildi", school && school.name === "Tezlik Auto Maktab");
check("status PENDING", school.status === "PENDING");
check("owner tayinlandi", school.ownerId === 2);

const ownerMembership = await svc.getMyActiveMembership(2);
check("OWNER a'zoligi yaratildi", ownerMembership && ownerMembership.role === "OWNER");

console.log("--- Owner allaqachon boshqa maktabga a'zo bo'lsa xato ---");
await checkThrows("owner band bo'lsa yaratilmaydi", "owner_already_member", () =>
  svc.createSchool(ceo, { name: "Ikkinchi maktab", ownerUserId: 2 }));

console.log("--- Maktab nomi bo'sh bo'lsa xato ---");
await checkThrows("bo'sh nom rad etiladi", "invalid_input", () =>
  svc.createSchool(ceo, { name: "  ", ownerUserId: 3 }));

console.log("--- Tasdiqlash (approve) ---");
const activated = await svc.setSchoolStatus(ceo, school.id, "ACTIVE");
check("status ACTIVE", activated.status === "ACTIVE");

console.log("--- Ruxsat tekshiruvi ---");
const ceoAccess = await svc.requireSchoolAccess(ceo, school.id);
check("CEO har doim o'tadi", ceoAccess.isCeo === true);

const ownerAccess = await svc.requireSchoolAccess({ id: 2, role: "USER" }, school.id, ["OWNER"]);
check("Owner o'z maktabiga kira oladi", ownerAccess.membership.role === "OWNER");

await checkThrows("a'zo bo'lmagan foydalanuvchi rad etiladi", "forbidden", () =>
  svc.requireSchoolAccess({ id: 4, role: "USER" }, school.id, ["OWNER"]));

console.log("--- Guruh yaratish ---");
const groupMorning = await svc.createGroup(school.id, "Ertalabki guruh");
const groupEvening = await svc.createGroup(school.id, "Kechki guruh");
check("2 ta guruh yaratildi", (await svc.listGroups(school.id)).length === 2);

console.log("--- O'qituvchi tayinlash ---");
const teacherM = await svc.inviteTeacherDirect(school.id, 3);
check("o'qituvchi TEACHER roli bilan qo'shildi", teacherM.role === "TEACHER");

await checkThrows("band foydalanuvchi o'qituvchi bo'la olmaydi", "already_member", () =>
  svc.inviteTeacherDirect(school.id, 2));

console.log("--- Taklif kodi yaratish va qo'shilish ---");
const invite = await svc.createInvitation(school.id, 2, { type: "GROUP", groupId: groupMorning.id });
check("kod formati AVTO-XXXXXX", /^AVTO-[A-Z0-9]{6}$/.test(invite.code));

const joinResult = await svc.joinSchoolByCode({ id: 4 }, invite.code.toLowerCase() + "  ");
check("kichik harf va probel bilan ham ishlaydi", joinResult.school.id === school.id);
check("talaba guruhga tayinlandi", joinResult.membership.groupId === groupMorning.id);
check("rol STUDENT", joinResult.membership.role === "STUDENT");

const usedInvite = await prisma.invitation.findUnique({ where: { id: invite.id } });
check("usedCount oshdi", usedInvite.usedCount === 1);

console.log("--- Bir xil foydalanuvchi qayta qo'shila olmaydi ---");
await checkThrows("allaqachon a'zo bo'lsa xato", "already_member", () =>
  svc.joinSchoolByCode({ id: 4 }, invite.code));

console.log("--- Yaroqsiz kodlar ---");
await checkThrows("mavjud bo'lmagan kod", "invalid_code", () =>
  svc.joinSchoolByCode({ id: 5 }, "AVTO-XXXXXX"));

const revoked = await svc.createInvitation(school.id, 2, { type: "SCHOOL" });
await svc.revokeInvitation(school.id, revoked.id);
await checkThrows("bekor qilingan kod", "code_revoked", () =>
  svc.joinSchoolByCode({ id: 5 }, revoked.code));

const limited = await svc.createInvitation(school.id, 2, { type: "SCHOOL", maxUses: 1 });
await svc.joinSchoolByCode({ id: 5 }, limited.code);
await prisma.user.create({ data: { id: 6, telegramId: 6n, name: "Student 6" } });
await checkThrows("limit tugagan kod", "code_exhausted", () =>
  svc.joinSchoolByCode({ id: 6 }, limited.code));

console.log("--- Maktab almashtirish: eski a'zolik arxivlanadi ---");
await prisma.user.create({ data: { id: 7, telegramId: 7n, name: "Owner 2" } });
const school2 = await svc.createSchool(ceo, { name: "Ikkinchi maktab", ownerUserId: 7 });
await svc.setSchoolStatus(ceo, school2.id, "ACTIVE");
const invite2 = await svc.createInvitation(school2.id, 7, { type: "SCHOOL" });

const beforeSwitch = await svc.getMyActiveMembership(4);
check("talaba hozir 1-maktabda", beforeSwitch.schoolId === school.id);

await svc.joinSchoolByCode({ id: 4 }, invite2.code);
const afterSwitch = await svc.getMyActiveMembership(4);
check("talaba endi 2-maktabda", afterSwitch.schoolId === school2.id);

const oldMembership = await prisma.membership.findUnique({ where: { id: beforeSwitch.id } });
check("eski a'zolik ARCHIVED", oldMembership.status === "ARCHIVED");
check("eski a'zolikda endedAt bor", oldMembership.endedAt !== null);

console.log("--- Faol bo'lmagan maktabga qo'shilib bo'lmaydi ---");
await prisma.user.create({ data: { id: 8, telegramId: 8n, name: "Owner 3" } });
const pendingSchool = await svc.createSchool(ceo, { name: "Kutilayotgan maktab", ownerUserId: 8 });
const inviteForPending = await svc.createInvitation(pendingSchool.id, 8, { type: "SCHOOL" });
await prisma.user.create({ data: { id: 9, telegramId: 9n, name: "Student 9" } });
await checkThrows("PENDING maktabga qo'shilib bo'lmaydi", "school_unavailable", () =>
  svc.joinSchoolByCode({ id: 9 }, inviteForPending.code));

console.log("--- Owner o'qituvchini to'xtatadi/faollashtiradi ---");
const suspended = await svc.suspendTeacher(school.id, teacherM.id);
check("SUSPENDED", suspended.status === "SUSPENDED");
const noAccess = await svc.requireSchoolAccess({ id: 3, role: "USER" }, school.id, ["TEACHER"]).catch((e) => e);
check("to'xtatilgan o'qituvchi kira olmaydi", noAccess.code === "forbidden");
const reactivated = await svc.reactivateTeacher(school.id, teacherM.id);
check("qayta faollashdi", reactivated.status === "ACTIVE");

console.log("--- Guruhga ko'chirish ---");
const moved = await svc.moveStudentToGroup(school.id, oldMembership.id, groupEvening.id);
check("moveStudentToGroup ishladi", moved.groupId === groupEvening.id);

console.log("--- A'zoni chiqarish ---");
const removed = await svc.removeMember(school.id, teacherM.id);
check("REMOVED", removed.status === "REMOVED");
await checkThrows("Owner ni removeMember orqali chiqarib bo'lmaydi", "forbidden", () =>
  svc.removeMember(school.id, ownerMembership.id));

console.log("--- O'z xohishi bilan chiqish ---");
const student5 = await svc.getMyActiveMembership(5);
await svc.leaveSchool({ id: 5 });
const afterLeave = await prisma.membership.findUnique({ where: { id: student5.id } });
check("ARCHIVED bo'ldi", afterLeave.status === "ARCHIVED");
await checkThrows("Owner chiqib keta olmaydi", "forbidden", () => svc.leaveSchool({ id: 2 }));

console.log("--- Maktab o'chirish ---");
const deleted = await svc.deleteSchool(ceo, school2.id);
check("o'chirildi", deleted.ok === true);
check("maktab endi topilmaydi", (await prisma.school.findUnique({ where: { id: school2.id } })) === null);

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
