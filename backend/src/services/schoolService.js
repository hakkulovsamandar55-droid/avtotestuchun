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

/**
 * Activity log yozuvi ASOSIY biznes amalini hech qachon buzmasligi kerak.
 *
 * SABAB (real xato tarixidan): ActivityType enumida SCHOOL_* qiymatlari
 * yo'q edi. Maktab muvaffaqiyatli yaratilardi, lekin tranzaksiyadan keyingi
 * logActivity() xato tashlab, foydalanuvchi "Server xatosi" ko'rardi —
 * aslida amal bajarilgan bo'lsa ham. Log — yordamchi ma'lumot, u tufayli
 * asosiy oqim yiqilmasligi kerak.
 */
async function safeLog(fn) {
  try {
    await fn();
  } catch (err) {
    console.error("[school] activity log yozilmadi:", err?.message || err);
  }
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
  if (schools.length === 0) return [];

  // N+1 EMAS: bitta groupBy so'rovi barcha maktablar uchun sonlarni oladi.
  // Avvalgi versiya har bir maktab uchun 2 ta so'rov yuborardi (100 maktab =
  // 200 so'rov). Endi jami 2 ta so'rov (schools + groupBy).
  const grouped = await prisma.membership.groupBy({
    by: ["schoolId", "role"],
    where: {
      schoolId: { in: schools.map((s) => s.id) },
      status: "ACTIVE",
      role: { in: ["TEACHER", "STUDENT"] },
    },
    _count: { _all: true },
  });

  const counts = new Map(); // schoolId -> { teacherCount, studentCount }
  for (const row of grouped) {
    const entry = counts.get(row.schoolId) || { teacherCount: 0, studentCount: 0 };
    const n = row._count?._all ?? 0;
    if (row.role === "TEACHER") entry.teacherCount = n;
    else if (row.role === "STUDENT") entry.studentCount = n;
    counts.set(row.schoolId, entry);
  }

  return schools.map((school) => ({
    ...school,
    teacherCount: counts.get(school.id)?.teacherCount ?? 0,
    studentCount: counts.get(school.id)?.studentCount ?? 0,
  }));
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

  if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
    throw new SchoolError("invalid_input", "Egasi tanlanishi shart");
  }

  const ownerUser = await prisma.user.findUnique({ where: { id: ownerUserId } });
  if (!ownerUser) throw notFound("Egasi qilib belgilanayotgan foydalanuvchi");

  let school;
  try {
    school = await prisma.$transaction(async (tx) => {
      // MUHIM: tekshiruv tranzaksiya ICHIDA. Avval u tashqarida edi — ikkita
      // so'rov bir vaqtda kelsa, ikkalasi ham "a'zo emas" deb o'tib ketardi.
      const existing = await tx.membership.findFirst({
        where: { userId: ownerUserId, status: "ACTIVE" },
      });
      if (existing) {
        throw new SchoolError(
          "owner_already_member",
          "Bu foydalanuvchi allaqachon boshqa maktabga a'zo"
        );
      }

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
  } catch (err) {
    // DB'dagi qisman unique indeks (school_memberships_one_active_per_user)
    // race condition'da P2002 beradi — uni tushunarli xatoga aylantiramiz.
    if (err?.code === "P2002") {
      throw new SchoolError(
        "owner_already_member",
        "Bu foydalanuvchi allaqachon boshqa maktabga a'zo"
      );
    }
    throw err;
  }

  // MUHIM: logActivity ASOSIY AMALNI BUZMASLIGI kerak. Maktab allaqachon
  // yaratilgan — agar log yozishda xato bo'lsa (masalan enum qiymati yo'q),
  // foydalanuvchiga yolg'on "Server xatosi" ko'rsatilmasligi shart.
  await safeLog(() =>
    logActivity(ceoUser.id, "SCHOOL_CREATED", `"${school.name}" maktabi yaratildi`, {
      schoolId: school.id,
    })
  );

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

  await safeLog(() =>
    logActivity(
      ceoUser.id,
      status === "ACTIVE" ? "SCHOOL_APPROVED" : "SCHOOL_DISABLED",
      `"${school.name}" maktabi ${status === "ACTIVE" ? "tasdiqlandi" : "to'xtatildi"}`,
      { schoolId }
    )
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

  await safeLog(() =>
    logActivity(ceoUser.id, "SCHOOL_DELETED", `"${school.name}" maktabi o'chirildi`, {
      schoolId,
    })
  );

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
  if (groups.length === 0) return [];

  // N+1 EMAS — bitta groupBy barcha guruhlar sonini oladi.
  const grouped = await prisma.membership.groupBy({
    by: ["groupId"],
    where: {
      groupId: { in: groups.map((g) => g.id) },
      role: "STUDENT",
      status: "ACTIVE",
    },
    _count: { _all: true },
  });

  const counts = new Map(grouped.map((r) => [r.groupId, r._count?._all ?? 0]));
  return groups.map((g) => ({ ...g, studentCount: counts.get(g.id) ?? 0 }));
}

/**
 * Owner o'qituvchi tayinlaydi. Tayinlanuvchi foydalanuvchi hali hech qanday
 * maktabga a'zo bo'lmasligi kerak.
 */
export async function inviteTeacherDirect(schoolId, teacherUserId) {
  // Foydalanuvchi umuman mavjudmi — aks holda Prisma FK xatosi (P2003) 500
  // bo'lib chiqardi, foydalanuvchiga tushunarsiz "Server xatosi" ko'rinardi.
  const user = await prisma.user.findUnique({ where: { id: teacherUserId } });
  if (!user) throw notFound("Foydalanuvchi");

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.membership.findFirst({
        where: { userId: teacherUserId, status: "ACTIVE" },
      });
      if (existing) {
        throw new SchoolError("already_member", "Bu foydalanuvchi allaqachon boshqa maktabga a'zo");
      }
      return tx.membership.create({
        data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" },
      });
    });
  } catch (err) {
    if (err?.code === "P2002") {
      throw new SchoolError("already_member", "Bu foydalanuvchi allaqachon boshqa maktabga a'zo");
    }
    throw err;
  }
}

/**
 * O'qituvchini guruhga tayinlaydi (yoki guruhdan chiqaradi — groupId: null).
 *
 * MUHIM: bitta guruhda bir nechta o'qituvchi bo'lishi mumkin — bu ataylab
 * shunday. Kichik maktabda bir guruhga ikki o'qituvchi (masalan nazariya va
 * amaliyot) tayinlanishi normal holat.
 */
export async function assignTeacherToGroup(schoolId, membershipId, groupId) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.schoolId !== schoolId || membership.role !== "TEACHER") {
    throw notFound("O'qituvchi a'zoligi");
  }

  // Guruh ROSTDAN HAM shu maktabga tegishlimi — aks holda boshqa maktabning
  // guruh ID sini yozib, o'qituvchini o'zga maktab guruhiga tayinlash va
  // shu orqali begona talabalar ma'lumotiga kirish mumkin bo'lardi.
  if (groupId != null) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.schoolId !== schoolId) {
      throw notFound("Guruh");
    }
  }

  return prisma.membership.update({
    where: { id: membershipId },
    data: { groupId },
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
  if (membership.status === "ACTIVE") return membership; // idempotent

  // MUHIM TUZATISH: eski izohda "boshqa maktabga a'zolik tekshiruvi shart
  // emas" deyilgan edi — bu NOTO'G'RI. O'qituvchi SUSPENDED bo'lib turgan
  // vaqtda boshqa maktabga talaba sifatida qo'shilishi mumkin (joinSchoolByCode
  // faqat ACTIVE a'zolikni arxivlaydi, SUSPENDED tegilmaydi). U holda qayta
  // faollashtirish DB'dagi partial unique indeksga urilib, 500 xato berardi.
  const competing = await prisma.membership.findFirst({
    where: { userId: membership.userId, status: "ACTIVE" },
  });
  if (competing) {
    throw new SchoolError(
      "already_member",
      "Bu o'qituvchi hozir boshqa maktabda faol — avval u yerdan chiqishi kerak"
    );
  }

  return prisma.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE", endedAt: null },
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
  if (typeof code !== "string" || !code.trim()) {
    throw new SchoolError("invalid_code", "Kod kiritilishi shart");
  }

  const normalized = code.trim().toUpperCase();
  const invitation = await prisma.invitation.findUnique({ where: { code: normalized } });
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

  // GROUP kodi, lekin guruh o'chirilgan bo'lsa (onDelete: SetNull) — groupId
  // null bo'lib qoladi. Bunday kod bilan qo'shilgan talaba guruhsiz osilib
  // qolardi va hech qanday homework olmasdi. Aniq xato berish to'g'riroq.
  if (invitation.type === "GROUP") {
    if (invitation.groupId == null) {
      throw new SchoolError("invalid_code", "Bu kodning guruhi o'chirilgan");
    }
    const group = await prisma.group.findUnique({ where: { id: invitation.groupId } });
    if (!group || group.schoolId !== invitation.schoolId) {
      throw new SchoolError("invalid_code", "Bu kodning guruhi topilmadi");
    }
  }

  // Foydalanuvchi allaqachon shu maktabga a'zomi (qayta ulanish)?
  const already = await getActiveMembership(user.id, invitation.schoolId);
  if (already) {
    throw new SchoolError("already_member", "Siz allaqachon bu maktabga a'zosiz");
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      // ATOMIK LIMIT TEKSHIRUVI: yuqoridagi tekshiruv tranzaksiyadan tashqarida
      // bo'lgani uchun ikki talaba bir vaqtda oxirgi bo'sh joyni egallashi
      // mumkin edi. updateMany + where sharti bitta atomik amalda limitni
      // ushlab qoladi — 0 qator yangilansa, demak limit tugagan.
      if (invitation.maxUses != null) {
        const claimed = await tx.invitation.updateMany({
          where: {
            id: invitation.id,
            revokedAt: null,
            usedCount: { lt: invitation.maxUses },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) {
          throw new SchoolError("code_exhausted", "Bu kod limiti tugagan");
        }
      } else {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Eski faol a'zolikni arxivlaymiz (boshqa maktabdan o'tayotgan bo'lsa)
      const existing = await tx.membership.findFirst({
        where: { userId: user.id, status: "ACTIVE" },
      });
      if (existing) {
        await tx.membership.update({
          where: { id: existing.id },
          data: { status: "ARCHIVED", endedAt: new Date() },
        });
      }

      return tx.membership.create({
        data: {
          userId: user.id,
          schoolId: invitation.schoolId,
          groupId: invitation.type === "GROUP" ? invitation.groupId : null,
          role: "STUDENT",
          status: "ACTIVE",
        },
      });
    });
  } catch (err) {
    if (err?.code === "P2002") {
      throw new SchoolError("already_member", "Siz allaqachon boshqa maktabda faolsiz");
    }
    throw err;
  }

  await safeLog(() =>
    logActivity(user.id, "SCHOOL_JOINED", `"${school.name}" maktabiga qo'shildi`, {
      schoolId: school.id,
    })
  );

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
