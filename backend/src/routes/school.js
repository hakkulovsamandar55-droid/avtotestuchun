import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { parsePagination } from "../lib/validate.js";
import * as schoolSvc from "../services/schoolService.js";
import * as hwSvc from "../services/homeworkService.js";
import * as schoolAnalytics from "../services/schoolAnalyticsService.js";

// Har bir joyda try/catch yozmaslik uchun kichik yordamchi — NaN yoki
// yaroqsiz ID Prisma'ga tushib 500 qaytarmasligi kerak.
function parseParam(req, res, name) {
  const value = Number(req.params[name]);
  if (!Number.isInteger(value) || value <= 0) {
    res.status(400).json({ error: `Noto'g'ri ${name}` });
    return null;
  }
  return value;
}

export const schoolRouter = Router();
schoolRouter.use(requireAuth, loadCurrentUser);

// ============================================================================
// XATO -> HTTP STATUS
// ============================================================================
const ERROR_STATUS = {
  not_found: 404,
  forbidden: 403,
  invalid_input: 400,
  owner_already_member: 409,
  already_member: 409,
  invalid_code: 404,
  code_revoked: 410,
  code_expired: 410,
  code_exhausted: 409,
  school_unavailable: 409,
  not_member: 409,
  code_generation_failed: 500,
};

function sendServiceError(res, err) {
  const status = ERROR_STATUS[err.code];
  if (!status) throw err;
  return res.status(status).json({ error: err.code, message: err.message });
}

// ============================================================================
// MIDDLEWARE: maktab kontekstini yuklash + ruxsat tekshirish
//
// URL: /api/school/:schoolId/...
// req.schoolId, req.isCeo, req.membership shu yerda o'rnatiladi.
// ============================================================================
function requireSchool(allowedRoles = null) {
  return asyncHandler(async (req, res, next) => {
    const schoolId = Number(req.params.schoolId);
    if (!Number.isInteger(schoolId) || schoolId <= 0) {
      return res.status(400).json({ error: "Noto'g'ri maktab ID" });
    }

    try {
      const { isCeo, membership } = await schoolSvc.requireSchoolAccess(
        req.user,
        schoolId,
        allowedRoles
      );
      req.schoolId = schoolId;
      req.isCeo = isCeo;
      req.membership = membership;
      next();
    } catch (err) {
      return sendServiceError(res, err);
    }
  });
}

// ============================================================================
// CEO — /api/school/admin/*  (global admin.js dan alohida — faqat maktab
// boshqaruviga oid, shuning uchun alohida fayl/route toza qoladi)
// ============================================================================

function requireCeo(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Bu bo'lim faqat platforma egasi uchun" });
  }
  next();
}

schoolRouter.get("/admin/schools", requireCeo, asyncHandler(async (req, res) => {
  const status = ["PENDING", "ACTIVE", "DISABLED"].includes(req.query.status)
    ? req.query.status
    : undefined;
  res.json({ schools: await schoolSvc.listSchools({ status }) });
}));

schoolRouter.post("/admin/schools", requireCeo, asyncHandler(async (req, res) => {
  try {
    const { name, ownerUserId, address, phone, brandColor } = req.body;
    const school = await schoolSvc.createSchool(req.user, {
      name,
      ownerUserId: Number(ownerUserId),
      address,
      phone,
      brandColor,
    });
    res.status(201).json({ school });
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// requireIdParam req.id ga yozadi va faqat bitta :id ga mo'ljallangan —
// bu yerda parametr nomi :schoolId, shuning uchun aniqlik uchun alohida,
// kichik middleware ishlatamiz (chalkashlikni oldini olish uchun).
function requireSchoolIdParam(req, res, next) {
  const schoolId = Number(req.params.schoolId);
  if (!Number.isInteger(schoolId) || schoolId <= 0) {
    return res.status(400).json({ error: "Noto'g'ri maktab ID" });
  }
  req.targetSchoolId = schoolId;
  next();
}

schoolRouter.patch(
  "/admin/schools/:schoolId/status",
  requireCeo,
  requireSchoolIdParam,
  asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    if (!["ACTIVE", "DISABLED", "PENDING"].includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri holat" });
    }
    try {
      const school = await schoolSvc.setSchoolStatus(req.user, req.targetSchoolId, status, reason);
      res.json({ school });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.delete(
  "/admin/schools/:schoolId",
  requireCeo,
  requireSchoolIdParam,
  asyncHandler(async (req, res) => {
    try {
      res.json(await schoolSvc.deleteSchool(req.user, req.targetSchoolId));
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.get("/admin/analytics", requireCeo, asyncHandler(async (req, res) => {
  res.json(await schoolAnalytics.getPlatformAnalytics());
}));

// ============================================================================
// TALABA — maktabga qo'shilish, o'z profilini ko'rish
// (schoolId ga bog'liq emas — foydalanuvchi hali hech qanday maktabda
// bo'lmasligi mumkin, shuning uchun requireSchool ishlatilmaydi)
// ============================================================================

// GET /api/school/me — joriy foydalanuvchining maktab a'zoligi (yoki null)
schoolRouter.get("/me", asyncHandler(async (req, res) => {
  const membership = await schoolSvc.getMyActiveMembership(req.user.id);
  if (!membership) return res.json({ membership: null });

  const school = await prisma.school.findUnique({ where: { id: membership.schoolId } });
  const group = membership.groupId
    ? await prisma.group.findUnique({ where: { id: membership.groupId } })
    : null;

  res.json({ membership, school, group });
}));

// POST /api/school/join  { code }
schoolRouter.post("/join", asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Kod kiritilishi shart" });
  }
  try {
    const { membership, school } = await schoolSvc.joinSchoolByCode(req.user, code);
    // Yangi talaba ochiq (tugamagan) homeworklarga ham yoziladi
    if (membership.groupId) {
      await hwSvc.enrollMembershipInGroupHomeworks(membership.id, membership.groupId);
    }
    res.status(201).json({ membership, school });
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// POST /api/school/leave — joriy maktabdan chiqish
schoolRouter.post("/leave", asyncHandler(async (req, res) => {
  try {
    res.json(await schoolSvc.leaveSchool(req.user));
  } catch (err) {
    return sendServiceError(res, err);
  }
}));

// GET /api/school/my-homework — talabaning o'z uy vazifalari
schoolRouter.get("/my-homework", asyncHandler(async (req, res) => {
  const membership = await schoolSvc.getMyActiveMembership(req.user.id);
  if (!membership || membership.role !== "STUDENT") {
    return res.json({ homework: [] });
  }
  res.json({ homework: await hwSvc.listMyHomework(membership.id) });
}));

// ============================================================================
// MAKTAB IChidagi endpointlar — /api/school/:schoolId/...
// Owner: hammasi. Teacher: faqat o'z guruhi. Student: faqat o'qish.
// ============================================================================

// GET /api/school/:schoolId — maktab profili (Owner/Teacher/Student/CEO)
schoolRouter.get(
  "/:schoolId",
  requireSchool(["OWNER", "TEACHER", "STUDENT"]),
  asyncHandler(async (req, res) => {
    const school = await prisma.school.findUnique({ where: { id: req.schoolId } });
    res.json({ school, myRole: req.isCeo ? "CEO" : req.membership.role });
  })
);

// PATCH /api/school/:schoolId — profilni tahrirlash (faqat Owner/CEO)
schoolRouter.patch(
  "/:schoolId",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    const { name, logoUrl, brandColor, address, phone } = req.body;
    const data = {};
    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: "Nom bo'sh bo'lmasligi kerak" });
      data.name = name.trim();
    }
    if (logoUrl !== undefined) data.logoUrl = logoUrl;
    if (brandColor !== undefined) data.brandColor = brandColor;
    if (address !== undefined) data.address = address;
    if (phone !== undefined) data.phone = phone;

    const school = await prisma.school.update({ where: { id: req.schoolId }, data });
    res.json({ school });
  })
);

// ---- Guruhlar ----

schoolRouter.get(
  "/:schoolId/groups",
  requireSchool(["OWNER", "TEACHER", "STUDENT"]),
  asyncHandler(async (req, res) => {
    res.json({ groups: await schoolSvc.listGroups(req.schoolId) });
  })
);

schoolRouter.post(
  "/:schoolId/groups",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    try {
      const group = await schoolSvc.createGroup(req.schoolId, req.body.name);
      res.status(201).json({ group });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

// ---- O'qituvchilar (faqat Owner) ----

schoolRouter.get(
  "/:schoolId/teachers",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    const teachers = await prisma.membership.findMany({
      where: { schoolId: req.schoolId, role: "TEACHER" },
      orderBy: { joinedAt: "desc" },
    });
    const withUsers = await Promise.all(
      teachers.map(async (m) => ({
        ...m,
        user: await prisma.user.findUnique({
          where: { id: m.userId },
          select: { id: true, name: true, username: true, avatarUrl: true },
        }),
      }))
    );
    res.json({ teachers: withUsers });
  })
);

// POST /api/school/:schoolId/teachers  { userId }
// Owner allaqachon platformada ro'yxatdan o'tgan foydalanuvchini to'g'ridan-to'g'ri
// o'qituvchi qilib tayinlaydi (masalan telegram username orqali topib).
// Umumiy holatda esa TEACHER turidagi taklif kodi ishlatiladi (invitations orqali).
schoolRouter.post(
  "/:schoolId/teachers",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    const userId = Number(req.body.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "Noto'g'ri foydalanuvchi ID" });
    }
    try {
      const membership = await schoolSvc.inviteTeacherDirect(req.schoolId, userId);
      res.status(201).json({ membership });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.patch(
  "/:schoolId/teachers/:membershipId/suspend",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    try {
      const membershipId = parseParam(req, res, "membershipId");
      if (membershipId === null) return;
      res.json({ membership: await schoolSvc.suspendTeacher(req.schoolId, membershipId) });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.patch(
  "/:schoolId/teachers/:membershipId/reactivate",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    try {
      const membershipId = parseParam(req, res, "membershipId");
      if (membershipId === null) return;
      res.json({ membership: await schoolSvc.reactivateTeacher(req.schoolId, membershipId) });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

// ---- A'zolar (talaba/o'qituvchi) boshqaruvi ----

schoolRouter.delete(
  "/:schoolId/members/:membershipId",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    try {
      const membershipId = parseParam(req, res, "membershipId");
      if (membershipId === null) return;
      res.json({ membership: await schoolSvc.removeMember(req.schoolId, membershipId) });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.patch(
  "/:schoolId/members/:membershipId/group",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    try {
      const membershipId = parseParam(req, res, "membershipId");
      if (membershipId === null) return;
      const groupId = req.body.groupId === null ? null : Number(req.body.groupId);
      const membership = await schoolSvc.moveStudentToGroup(req.schoolId, membershipId, groupId);
      res.json({ membership });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

// GET /api/school/:schoolId/students — Owner: barchasi; Teacher: faqat o'z guruhi
schoolRouter.get(
  "/:schoolId/students",
  requireSchool(["OWNER", "TEACHER"]),
  asyncHandler(async (req, res) => {
    const where = { schoolId: req.schoolId, role: "STUDENT", status: "ACTIVE" };
    // Teacher faqat o'z guruhini ko'radi — bu ma'lumot oqishini oldini oladi
    if (!req.isCeo && req.membership.role === "TEACHER") {
      where.groupId = req.membership.groupId;
    }
    if (req.query.groupId) where.groupId = Number(req.query.groupId);

    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 200 });
    const students = await prisma.membership.findMany({ where, take: limit, skip: offset });

    const withUsers = await Promise.all(
      students.map(async (m) => ({
        ...m,
        user: await prisma.user.findUnique({
          where: { id: m.userId },
          select: { id: true, name: true, username: true, avatarUrl: true, examReadiness: true },
        }),
      }))
    );
    res.json({ students: withUsers });
  })
);

// ---- Taklif kodlari ----

schoolRouter.get(
  "/:schoolId/invitations",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    res.json({ invitations: await schoolSvc.listInvitations(req.schoolId) });
  })
);

schoolRouter.post(
  "/:schoolId/invitations",
  requireSchool(["OWNER", "TEACHER"]),
  asyncHandler(async (req, res) => {
    try {
      // O'qituvchi faqat o'z guruhi uchun kod yarata oladi
      const { type, groupId, maxUses, expiresAt } = req.body;
      if (!req.isCeo && req.membership.role === "TEACHER") {
        if (type !== "GROUP" || Number(groupId) !== req.membership.groupId) {
          return res
            .status(403)
            .json({ error: "O'qituvchi faqat o'z guruhi uchun taklif kodi yarata oladi" });
        }
      }
      const invitation = await schoolSvc.createInvitation(req.schoolId, req.user.id, {
        type,
        groupId: groupId ? Number(groupId) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt,
      });
      res.status(201).json({ invitation });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

schoolRouter.delete(
  "/:schoolId/invitations/:invitationId",
  requireSchool(["OWNER", "TEACHER"]),
  asyncHandler(async (req, res) => {
    try {
      const invitationId = parseParam(req, res, "invitationId");
      if (invitationId === null) return;
      res.json(await schoolSvc.revokeInvitation(req.schoolId, invitationId));
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

// ---- Uy vazifalari ----

// GET /api/school/:schoolId/groups/:groupId/homework
schoolRouter.get(
  "/:schoolId/groups/:groupId/homework",
  requireSchool(["OWNER", "TEACHER", "STUDENT"]),
  asyncHandler(async (req, res) => {
    const groupId = parseParam(req, res, "groupId");
    if (groupId === null) return;
    // Teacher/Student faqat o'z guruhini ko'ra oladi
    if (!req.isCeo && req.membership.role !== "OWNER" && req.membership.groupId !== groupId) {
      return res.status(403).json({ error: "Bu guruhga kirish huquqingiz yo'q" });
    }
    await hwSvc.expireOverdueSubmissions(groupId); // lazy — muddati o'tganlarni yangilaydi
    res.json({ homework: await hwSvc.listGroupHomework(groupId) });
  })
);

// POST /api/school/:schoolId/groups/:groupId/homework — faqat Teacher/Owner
schoolRouter.post(
  "/:schoolId/groups/:groupId/homework",
  requireSchool(["OWNER", "TEACHER"]),
  asyncHandler(async (req, res) => {
    const groupId = parseParam(req, res, "groupId");
    if (groupId === null) return;
    if (!req.isCeo && req.membership.role === "TEACHER" && req.membership.groupId !== groupId) {
      return res.status(403).json({ error: "Faqat o'z guruhingizga vazifa bera olasiz" });
    }
    try {
      const { title, type, params, minScore, deadline } = req.body;
      const homework = await hwSvc.createHomework(req.schoolId, groupId, req.user.id, {
        title,
        type,
        params,
        minScore: minScore != null ? Number(minScore) : null,
        deadline,
      });
      res.status(201).json({ homework });
    } catch (err) {
      return sendServiceError(res, err);
    }
  })
);

// ============================================================================
// O'QITUVCHI DASHBOARD — /api/school/:schoolId/teacher/*
// ============================================================================

schoolRouter.get(
  "/:schoolId/teacher/dashboard",
  requireSchool(["OWNER", "TEACHER"]),
  asyncHandler(async (req, res) => {
    const groupId = req.isCeo ? Number(req.query.groupId) : req.membership.groupId;
    if (!groupId) {
      return res.status(400).json({ error: "Guruh tanlanmagan" });
    }
    res.json(await schoolAnalytics.getTeacherDashboard(req.schoolId, groupId));
  })
);

schoolRouter.get(
  "/:schoolId/groups/:groupId/leaderboard",
  requireSchool(["OWNER", "TEACHER", "STUDENT"]),
  asyncHandler(async (req, res) => {
    const groupId = parseParam(req, res, "groupId");
    if (groupId === null) return;
    if (!req.isCeo && req.membership.role !== "OWNER" && req.membership.groupId !== groupId) {
      return res.status(403).json({ error: "Bu guruhga kirish huquqingiz yo'q" });
    }
    res.json(await schoolAnalytics.getGroupLeaderboard(groupId));
  })
);

// ============================================================================
// MAKTAB ANALITIKASI — Owner/CEO
// ============================================================================

schoolRouter.get(
  "/:schoolId/analytics",
  requireSchool(["OWNER"]),
  asyncHandler(async (req, res) => {
    res.json(await schoolAnalytics.getSchoolAnalytics(req.schoolId));
  })
);
