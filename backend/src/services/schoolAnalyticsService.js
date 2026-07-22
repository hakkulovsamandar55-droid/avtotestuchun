import { prisma } from "../db.js";

// ============================================================================
// MAKTAB ANALITIKASI — uch daraja: O'qituvchi, Maktab (Owner), Platforma (CEO)
//
// Bu servis faqat O'QIYDI va agregatlaydi — mavjud Attempt/ExamAttempt/User
// jadvallaridan. Yangi statistika saqlash mexanizmi yaratilmadi (spec:
// "Reuse existing... Do not duplicate logic").
// ============================================================================

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

async function membersOfGroup(groupId) {
  return prisma.membership.findMany({
    where: { groupId, role: "STUDENT", status: "ACTIVE" },
  });
}

/**
 * Bitta talabaning umumiy ko'rsatkichlari — mavjud Attempt/ExamAttempt
 * jadvallaridan hisoblanadi (User.examReadiness ham shu yerdan keladi,
 * stats.js allaqachon uni saqlaydi).
 */
async function studentSummary(membership) {
  const user = await prisma.user.findUnique({
    where: { id: membership.userId },
    select: { id: true, name: true, avatarUrl: true, examReadiness: true, lastOnlineAt: true },
  });

  const [attemptAgg, examCount] = await Promise.all([
    prisma.attempt.aggregate({
      where: { userId: membership.userId },
      _count: { _all: true },
      _sum: { correctCount: true, totalCount: true },
    }),
    prisma.examAttempt.count({
      where: { userId: membership.userId, status: "COMPLETED", passed: true },
    }),
  ]);

  const totalAnswered = attemptAgg._sum.totalCount || 0;
  const totalCorrect = attemptAgg._sum.correctCount || 0;
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // "Faol" — so'nggi 7 kunda faoliyat bo'lgan (jismoniy davomat emas,
  // ilova ichidagi faollik — knowledge doc talabiga muvofiq)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isActiveRecently = user.lastOnlineAt ? user.lastOnlineAt >= sevenDaysAgo : false;

  return {
    membershipId: membership.id,
    userId: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl,
    examReadiness: user.examReadiness,
    accuracyPct,
    testsCompleted: attemptAgg._count._all,
    officialExamsPassed: examCount,
    isActiveRecently,
  };
}

// ============================================================================
// O'QITUVCHI DASHBOARD
// ============================================================================

export async function getTeacherDashboard(schoolId, groupId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.schoolId !== schoolId) {
    const err = new Error("Guruh topilmadi");
    err.code = "not_found";
    throw err;
  }

  const members = await membersOfGroup(groupId);
  const summaries = await Promise.all(members.map(studentSummary));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [homeworkDueToday, examsToday] = await Promise.all([
    prisma.homework.findMany({
      where: { groupId, deadline: { gte: today, lt: new Date(today.getTime() + 86400000) } },
    }),
    prisma.examAttempt.count({
      where: {
        userId: { in: members.map((m) => m.userId) },
        status: "COMPLETED",
        finishedAt: { gte: today },
      },
    }),
  ]);

  const sorted = [...summaries].sort((a, b) => b.examReadiness - a.examReadiness);
  const weakStudents = sorted.slice(-5).reverse(); // eng past tayyorgarlik
  const strongStudents = sorted.slice(0, 5); // eng yuqori tayyorgarlik

  const avgReadiness =
    summaries.length > 0
      ? Math.round(summaries.reduce((sum, s) => sum + s.examReadiness, 0) / summaries.length)
      : 0;
  const avgAccuracy =
    summaries.length > 0
      ? Math.round(summaries.reduce((sum, s) => sum + s.accuracyPct, 0) / summaries.length)
      : 0;
  const activeCount = summaries.filter((s) => s.isActiveRecently).length;

  return {
    group,
    studentCount: members.length,
    activeCount,
    avgReadiness,
    avgAccuracy,
    homeworkDueToday: homeworkDueToday.length,
    examsToday,
    weakStudents,
    strongStudents,
    students: summaries,
  };
}

// ============================================================================
// GURUH REYTINGI
// ============================================================================

export async function getGroupLeaderboard(groupId) {
  const members = await membersOfGroup(groupId);
  const summaries = await Promise.all(members.map(studentSummary));

  const ranked = [...summaries]
    .sort((a, b) => b.examReadiness - a.examReadiness || b.accuracyPct - a.accuracyPct)
    .map((s, i) => ({ rank: i + 1, ...s }));

  return { groupId, entries: ranked };
}

// ============================================================================
// MAKTAB ANALITIKASI — Owner
// ============================================================================

export async function getSchoolAnalytics(schoolId) {
  const [teachers, students, groups] = await Promise.all([
    prisma.membership.findMany({ where: { schoolId, role: "TEACHER", status: "ACTIVE" } }),
    prisma.membership.findMany({ where: { schoolId, role: "STUDENT", status: "ACTIVE" } }),
    prisma.group.findMany({ where: { schoolId } }),
  ]);

  const studentSummaries = await Promise.all(students.map(studentSummary));

  const avgReadiness =
    studentSummaries.length > 0
      ? Math.round(
          studentSummaries.reduce((sum, s) => sum + s.examReadiness, 0) / studentSummaries.length
        )
      : 0;

  const passedExamsTotal = studentSummaries.reduce((sum, s) => sum + s.officialExamsPassed, 0);
  const activeStudents = studentSummaries.filter((s) => s.isActiveRecently).length;

  // Har bir o'qituvchi bo'yicha o'z guruhi(lari)ning o'rtacha tayyorgarligi
  const teacherPerformance = await Promise.all(
    teachers.map(async (t) => {
      const user = await prisma.user.findUnique({
        where: { id: t.userId },
        select: { name: true },
      });
      const groupMembers = t.groupId ? await membersOfGroup(t.groupId) : [];
      const groupSummaries = await Promise.all(groupMembers.map(studentSummary));
      const avg =
        groupSummaries.length > 0
          ? Math.round(
              groupSummaries.reduce((sum, s) => sum + s.examReadiness, 0) / groupSummaries.length
            )
          : 0;
      return {
        membershipId: t.id,
        name: user?.name || "—",
        groupId: t.groupId,
        studentCount: groupMembers.length,
        avgReadiness: avg,
      };
    })
  );

  // Homework bajarilish foizi
  const homeworkIds = (await prisma.homework.findMany({ where: { schoolId } })).map((h) => h.id);
  let homeworkCompletionPct = 0;
  if (homeworkIds.length > 0) {
    const [total, completed] = await Promise.all([
      prisma.homeworkSubmission.count({ where: { homeworkId: { in: homeworkIds } } }),
      prisma.homeworkSubmission.count({
        where: { homeworkId: { in: homeworkIds }, status: "COMPLETED" },
      }),
    ]);
    homeworkCompletionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  return {
    teacherCount: teachers.length,
    studentCount: students.length,
    groupCount: groups.length,
    activeStudents,
    avgReadiness,
    passedExamsTotal,
    homeworkCompletionPct,
    teacherPerformance,
  };
}

// ============================================================================
// PLATFORMA ANALITIKASI — CEO
// ============================================================================

export async function getPlatformAnalytics() {
  const [totalSchools, activeSchools, pendingSchools, disabledSchools] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { status: "ACTIVE" } }),
    prisma.school.count({ where: { status: "PENDING" } }),
    prisma.school.count({ where: { status: "DISABLED" } }),
  ]);

  const [totalTeachers, totalStudents] = await Promise.all([
    prisma.membership.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    prisma.membership.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
  ]);

  // Maktab reytingi — o'rtacha tayyorgarlik bo'yicha
  const activeSchoolRows = await prisma.school.findMany({ where: { status: "ACTIVE" } });
  const rankings = await Promise.all(
    activeSchoolRows.map(async (school) => {
      const students = await prisma.membership.findMany({
        where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" },
      });
      const summaries = await Promise.all(students.map(studentSummary));
      const avgReadiness =
        summaries.length > 0
          ? Math.round(summaries.reduce((sum, s) => sum + s.examReadiness, 0) / summaries.length)
          : 0;
      return { schoolId: school.id, name: school.name, studentCount: students.length, avgReadiness };
    })
  );
  rankings.sort((a, b) => b.avgReadiness - a.avgReadiness);

  return {
    totalSchools,
    activeSchools,
    pendingSchools,
    disabledSchools,
    totalTeachers,
    totalStudents,
    schoolRankings: rankings,
  };
}
