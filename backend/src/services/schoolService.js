import crypto from "node:crypto";
import { prisma } from "../db.js";
import { logActivity } from "./activity.js";

// ============================================================================
// HAYDOVCHILIK MAKTABLARI — biznes mantiqi
//
// TO'RT ISHTIROKCHI:
//   CEO     — User.role === "ADMIN" (global, mavjud rol)
//   OWNER   — Membership.role === "OWNER" (maktab egasi)
//   TEACHER — Membership.role === "TEACHER"
//   STUDENT — Membership.role === "STUDENT"
//
// ASOSIY QOIDA: bitta foydalanuvchi bir vaqtning o'zida faqat BITTA
// ACTIVE Membership ga ega bo'lishi mumkin. DB'da qisman unique indeks
// bilan himoyalangan (migration.sql), bu yerda ham tekshiriladi — ikkalasi
// birga: DB race condition'lardan, service esa tushunarli xato xabaridan
// himoya qiladi.
// ============================================================================

class SchoolError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function notFound(what) {
  return new SchoolError("not_found", `${what} topilmadi`);
}
function forbidden(message) {
  return new SchoolError("forbidden", message);
}

// ---- Taklif kodi generatsiyasi ----

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 0/O, 1/I kabi chalkash belgilar yo'q

function generateInviteCode() {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return `AVTO-${code}`;
}

// ============================================================================
// RUXSAT TEKSHIRUVLARI — barcha route'lar shu funksiyalardan foydalanadi
// ============================================================================

/** Foydalanuvchining berilgan maktabdagi FAOL a'zoligini topadi (yoki null). */
export async function getActiveMembership(userId, schoolId) {
  return prisma.membership.findFirst({
    where: { userId, schoolId, status: "ACTIVE" },
  });
}

/** Foydalanuvchining istalgan maktabdagi joriy FAOL a'zoligi. */
export async function getMyActiveMembership(userId) {
  return prisma.membership.findFirst({ where: { userId, status: "ACTIVE" } });
}

/**
 * Maktabga kirish huquqini tekshiradi va a'zolikni qaytaradi.
 * CEO (global ADMIN) har doim o'tadi — lekin buni chaqiruvchi biladi
 * (isCeo bayrog'i orqali), chunki CEO uchun ba'zi UI elementlari boshqacha.
 */
export async function requireSchoolAccess(user, schoolId, allowedRoles = null) {
  if (user.role === "ADMIN") {
    return { isCeo: true, membership: null };
  }

  const membership = await getActiveMembership(user.id, schoolId);
  if (!membership) {
    throw forbidden("Siz bu maktabga a'zo emassiz");
  }
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw forbidden("Bu amal uchun huquqingiz yetarli emas");
  }
  return { isCeo: false, membership };
}

// ============================================================================
// CEO — maktablarni boshqarish
// ============================================================================

export async function listSchools({ status } = {}) {
  const where = status ? { status } : {};
  const schools = await prisma.school.findMany({ where, orderBy: { createdAt: "desc" } });

  // Har bir maktab uchun tezkor sonlar — alohida so'rovlar, lekin ro'yxat
  // odatda kichik (o'nlab maktab), shuning uchun N+1 muammosi emas.
  const withCounts = await Promise.all(
    schools.map(async (school) => {
      const [teacherCount, studentCount] = await Promise.all([
        prisma.membership.count({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" } }),
        prisma.membership.count({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" } }),
      ]);
      return { ...school, teacherCount, studentCount };
    })
  );

  return withCounts;
}

/**
 * CEO yangi maktab yaratadi va unga OWNER tayinlaydi.
 * Owner sifatida tayinlanadigan foydalanuvchi allaqachon boshqa maktabga
 * a'zo bo'lmasligi kerak (bitta faol a'zolik qoidasi).
 */
export async function createSchool(ceoUser, { name, ownerUserId, address, phone, brandColor }) {
  if (!name || !name.trim()) {
    throw new SchoolError("invalid_input", "Maktab nomi kiritilishi shart");
  }

  const ownerUser = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!ownerUser) throw notFound("Egasi qilib belgilanayotgan foydalanuvchi");

  const existing = await getMyActiveMembership(ownerUserId);
  if (existing) {
    throw new SchoolError(
      "owner_already_member",
      "Bu foydalanuvchi allaqachon boshqa maktabga a'zo"
    );
  }

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        brandColor: brandColor || null,
        status: "PENDING",
        ownerId: ownerUserId,
        createdById: ceoUser.id,
      },
    });

    await tx.membership.create({
      data: {
        userId: ownerUserId,
        schoolId: created.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    return created;
  });

  await logActivity(ceoUser.id, "SCHOOL_CREATED", `"${school.name}" maktabi yaratildi`, {
    schoolId: school.id,
  });

  return school;
}

/** CEO maktab holatini o'zgartiradi: tasdiqlash (ACTIVE) yoki to'xtatish (DISABLED). */
export async function setSchoolStatus(ceoUser, schoolId, status, reason) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw notFound("Maktab");

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: {
      status,
      disabledReason: status === "DISABLED" ? reason || null : null,
      disabledAt: status === "DISABLED" ? new Date() : null,
    },
  });

  await logActivity(
    ceoUser.id,
    status === "ACTIVE" ? "SCHOOL_APPROVED" : "SCHOOL_DISABLED",
    `"${school.name}" maktabi ${status === "ACTIVE" ? "tasdiqlandi" : "to'xtatildi"}`,
    { schoolId }
  );

  return updated;
}

/** CEO maktabni butunlay o'chiradi. Barcha bog'liq ma'lumot kaskad o'chadi. */
export async function deleteSchool(ceoUser, schoolId) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw notFound("Maktab");

  // Barcha a'zoliklarni ARCHIVED qilamiz — o'chirishdan oldin, chunki
  // maktab o'chsa Membership'lar kaskad o'chadi, lekin foydalanuvchilarga
  // "hozir hech qanday maktabga a'zo emassiz" holatini to'g'ri qaytarish
  // uchun avval yakunlash kerak emas (kaskad allaqachon buni hal qiladi).
  await prisma.school.delete({ where: { id: schoolId } });

  await logActivity(ceoUser.id, "SCHOOL_DELETED", `"${school.name}" maktabi o'chirildi`, {
    schoolId,
  });

  return { ok: true };
}

// ============================================================================
// OWNER — o'qituvchi va guruh boshqaruvi
// ============================================================================

export async function createGroup(schoolId, name) {
  if (!name || !name.trim()) {
    throw new SchoolError("invalid_input", "Guruh nomi kiritilishi shart");
  }
  return prisma.group.create({ data: { schoolId, name: name.trim() } });
}

export async function listGroups(schoolId) {
  const groups = await prisma.group.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" } });
  const withCounts = await Promise.all(
    groups.map(async (g) => {
      const studentCount = await prisma.membership.count({
        where: { groupId: g.id, role: "STUDENT", status: "ACTIVE" },
      });
      return { ...g, studentCount };
    })
  );
  return withCounts;
}

/**
 * Owner o'qituvchi tayinlaydi. Tayinlanuvchi foydalanuvchi hali hech qanday
 * maktabga a'zo bo'lmasligi kerak.
 */
export async function inviteTeacherDirect(schoolId, teacherUserId) {
  const existing = await getMyActiveMembership(teacherUserId);
  if (existing) {
    throw new SchoolError("already_member", "Bu foydalanuvchi allaqachon boshqa maktabga a'zo");
  }

  return prisma.membership.create({
    data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
}

/** Owner o'qituvchini vaqtincha to'xtatadi (kirish huquqi yo'qoladi). */
export async function suspendTeacher(schoolId, membershipId) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.schoolId !== schoolId || membership.role !== "TEACHER") {
    throw notFound("O'qituvchi a'zoligi");
  }
  return prisma.membership.update({
    where: { id: membershipId },
    data: { status: "SUSPENDED" },
  });
}

export async function reactivateTeacher(schoolId, membershipId) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.schoolId !== schoolId || membership.role !== "TEACHER") {
    throw notFound("O'qituvchi a'zoligi");
  }
  // Qayta faollashtirishda ham "bitta faol a'zolik" qoidasi buzilmasligi
  // kerak — lekin bu o'qituvchi allaqachon shu maktabga tegishli bo'lgani
  // uchun (faqat SUSPENDED->ACTIVE), boshqa maktabga a'zolik tekshiruvi
  // shart emas.
  return prisma.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE" },
  });
}

/** Owner o'qituvchi/talabani maktabdan butunlay chiqaradi. */
export async function removeMember(schoolId, membershipId) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.schoolId !== schoolId) throw notFound("A'zolik");
  if (membership.role === "OWNER") {
    throw forbidden("Maktab egasini bu yo'l bilan chiqarib bo'lmaydi");
  }
  return prisma.membership.update({
    where: { id: membershipId },
    data: { status: "REMOVED", endedAt: new Date() },
  });
}

/** Owner talabani boshqa guruhga ko'chiradi. */
export async function moveStudentToGroup(schoolId, membershipId, groupId) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.schoolId !== schoolId) throw notFound("A'zolik");

  if (groupId !== null) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.schoolId !== schoolId) throw notFound("Guruh");
  }

  return prisma.membership.update({ where: { id: membershipId }, data: { groupId } });
}

// ============================================================================
// TAKLIF KODLARI
// ============================================================================

export async function createInvitation(schoolId, createdById, { type, groupId, maxUses, expiresAt }) {
  if (type === "GROUP") {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.schoolId !== schoolId) throw notFound("Guruh");
  }

  // Kod takrorlanmasligini kafolatlash — juda kam ehtimol, lekin arzon tekshiruv
  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateInviteCode();
    const exists = await prisma.invitation.findUnique({ where: { code } });
    if (!exists) break;
    code = null;
  }
  if (!code) throw new SchoolError("code_generation_failed", "Kod yaratib bo'lmadi, qayta urinib ko'ring");

  return prisma.invitation.create({
    data: {
      code,
      type,
      schoolId,
      groupId: type === "GROUP" ? groupId : null,
      createdById,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
}

export async function revokeInvitation(schoolId, invitationId) {
  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.schoolId !== schoolId) throw notFound("Taklif");
  return prisma.invitation.update({ where: { id: invitationId }, data: { revokedAt: new Date() } });
}

export async function listInvitations(schoolId) {
  return prisma.invitation.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" } });
}

/**
 * Talaba taklif kodi orqali maktabga qo'shiladi.
 *
 * Bir vaqtda faqat bitta faol a'zolik qoidasi shu yerda kafolatlanadi —
 * agar foydalanuvchi allaqachon biror maktabga a'zo bo'lsa, eski a'zolik
 * ARCHIVED qilinadi (spec: "eski a'zolik arxivlanadi").
 */
export async function joinSchoolByCode(user, code) {
  const invitation = await prisma.invitation.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!invitation) throw new SchoolError("invalid_code", "Kod topilmadi");
  if (invitation.revokedAt) throw new SchoolError("code_revoked", "Bu kod bekor qilingan");
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new SchoolError("code_expired", "Bu kodning muddati tugagan");
  }
  if (invitation.maxUses != null && invitation.usedCount >= invitation.maxUses) {
    throw new SchoolError("code_exhausted", "Bu kod limiti tugagan");
  }

  const school = await prisma.school.findUnique({ where: { id: invitation.schoolId } });
  if (!school || school.status !== "ACTIVE") {
    throw new SchoolError("school_unavailable", "Bu maktab hozircha faol emas");
  }

  // Foydalanuvchi allaqachon shu maktabga a'zomi (qayta ulanish)?
  const already = await getActiveMembership(user.id, invitation.schoolId);
  if (already) {
    throw new SchoolError("already_member", "Siz allaqachon bu maktabga a'zosiz");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Eski faol a'zolikni arxivlaymiz (boshqa maktabdan o'tayotgan bo'lsa)
    const existing = await tx.membership.findFirst({ where: { userId: user.id, status: "ACTIVE" } });
    if (existing) {
      await tx.membership.update({
        where: { id: existing.id },
        data: { status: "ARCHIVED", endedAt: new Date() },
      });
    }

    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        schoolId: invitation.schoolId,
        groupId: invitation.type === "GROUP" ? invitation.groupId : null,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { usedCount: { increment: 1 } },
    });

    return membership;
  });

  await logActivity(user.id, "SCHOOL_JOINED", `"${school.name}" maktabiga qo'shildi`, {
    schoolId: school.id,
  });

  return { membership: result, school };
}

/** Talaba/o'qituvchi maktabdan o'z xohishi bilan chiqadi. */
export async function leaveSchool(user) {
  const membership = await getMyActiveMembership(user.id);
  if (!membership) throw new SchoolError("not_member", "Siz hech qanday maktabga a'zo emassiz");
  if (membership.role === "OWNER") {
    throw forbidden("Maktab egasi chiqib keta olmaydi — avval CEO bilan bog'laning");
  }

  return prisma.membership.update({
    where: { id: membership.id },
    data: { status: "ARCHIVED", endedAt: new Date() },
  });
}

export { SchoolError };
