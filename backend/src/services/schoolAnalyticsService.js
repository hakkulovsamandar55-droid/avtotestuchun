import { prisma } from "../db.js";

// ============================================================================
// MAKTAB ANALITIKASI — uch daraja: O'qituvchi, Maktab (Owner), Platforma (CEO)
//
// Bu servis faqat O'QIYDI va agregatlaydi — mavjud Attempt/ExamAttempt/User
// jadvallaridan. Yangi statistika saqlash mexanizmi yaratilmadi (spec:
// "Reuse existing... Do not duplicate logic").
// ============================================================================

async function membersOfGroup(groupId) {
  return prisma.membership.findMany({
    where: { groupId, role: "STUDENT", status: "ACTIVE" },
  });
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * BIR NECHTA talabaning ko'rsatkichlarini BATCH holda hisoblaydi.
 *
 * NIMA UCHUN O'ZGARTIRILDI: avvalgi `studentSummary(membership)` har bir
 * talaba uchun alohida 3 ta so'rov yuborardi (user + attempt.aggregate +
 * examAttempt.count). 200 talabali maktabda bu 600 ta so'rov — CEO
 * analitikasida esa har maktab uchun takrorlanardi, ya'ni minglab so'rov.
 *
 * Endi talabalar soni qanday bo'lishidan qat'i nazar JAMI 3 ta so'rov:
 *   1) users        — findMany({ id: { in: [...] } })
 *   2) attempts     — groupBy(userId) bilan sum/count
 *   3) examAttempts — groupBy(userId) bilan count
 *
 * Natija tartibi kirish `memberships` tartibiga mos keladi.
 */
async function summarizeStudents(memberships) {
  if (!memberships || memberships.length === 0) return [];

  const userIds = [...new Set(memberships.map((m) => m.userId))];

  const [users, attemptRows, examRows] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true, examReadiness: true, lastOnlineAt: true },
    }),
    prisma.attempt.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
      _sum: { correctCount: true, totalCount: true },
    }),
    prisma.examAttempt.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "COMPLETED", passed: true },
      _count: { _all: true },
    }),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));
  const attemptByUser = new Map(attemptRows.map((r) => [r.userId, r]));
  const examByUser = new Map(examRows.map((r) => [r.userId, r._count?._all ?? 0]));

  const activeCutoff = new Date(Date.now() - SEVEN_DAYS_MS);

  return memberships.map((membership) => {
    const user = userById.get(membership.userId);
    const agg = attemptByUser.get(membership.userId);

    const totalAnswered = agg?._sum?.totalCount || 0;
    const totalCorrect = agg?._sum?.correctCount || 0;
    const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Foydalanuvchi topilmasligi normal holat emas, lekin analitika shu
    // sabab butunlay yiqilmasligi kerak — xavfsiz standart qiymatlar.
    return {
      membershipId: membership.id,
      userId: membership.userId,
      name: user?.name ?? "—",
      avatarUrl: user?.avatarUrl ?? null,
      examReadiness: user?.examReadiness ?? 0,
      accuracyPct,
      testsCompleted: agg?._count?._all ?? 0,
      officialExamsPassed: examByUser.get(membership.userId) ?? 0,
      isActiveRecently: user?.lastOnlineAt ? user.lastOnlineAt >= activeCutoff : false,
    };
  });
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
  const summaries = await summarizeStudents(members);

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

  // MUHIM: kichik guruhlarda ro'yxatlar KESISHMASLIGI kerak. Avval
  // `slice(0,5)` va `slice(-5)` ishlatilardi — 5 talabali guruhda AYNAN
  // BIR XIL 5 talaba ham "kuchli", ham "kuchsiz" bo'lib ko'rinardi, bu
  // o'qituvchi uchun mantiqsiz. Endi ro'yxatlar hech qachon ustma-ust
  // tushmaydi: har biriga eng ko'pi bilan yarmini beramiz.
  const half = Math.floor(sorted.length / 2);
  const take = Math.min(5, half);
  const strongStudents = take > 0 ? sorted.slice(0, take) : [];
  const weakStudents = take > 0 ? sorted.slice(-take).reverse() : [];

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
  const summaries = await summarizeStudents(members);

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

  const studentSummaries = await summarizeStudents(students);

  const avgReadiness =
    studentSummaries.length > 0
      ? Math.round(
          studentSummaries.reduce((sum, s) => sum + s.examReadiness, 0) / studentSummaries.length
        )
      : 0;

  const passedExamsTotal = studentSummaries.reduce((sum, s) => sum + s.officialExamsPassed, 0);
  const activeStudents = studentSummaries.filter((s) => s.isActiveRecently).length;

  // Har bir o'qituvchi bo'yicha o'z guruhining o'rtacha tayyorgarligi.
  //
  // QAYTA SO'ROV YO'Q: `students` (maktabning barcha faol talabalari) va
  // ularning `studentSummaries` allaqachon yuqorida yuklangan. Avvalgi kod
  // har o'qituvchi uchun guruh a'zolarini QAYTADAN so'rab, ustiga yana
  // summarize qilardi. Endi mavjud ma'lumotni guruh bo'yicha guruhlaymiz.
  const summaryByMembershipId = new Map(studentSummaries.map((s) => [s.membershipId, s]));

  const summariesByGroupId = new Map(); // groupId -> summary[]
  for (const student of students) {
    if (student.groupId == null) continue;
    const summary = summaryByMembershipId.get(student.id);
    if (!summary) continue;
    if (!summariesByGroupId.has(student.groupId)) summariesByGroupId.set(student.groupId, []);
    summariesByGroupId.get(student.groupId).push(summary);
  }

  // O'qituvchi ismlari — bitta so'rovda
  const teacherUsers = await prisma.user.findMany({
    where: { id: { in: teachers.map((t) => t.userId) } },
    select: { id: true, name: true },
  });
  const teacherNameById = new Map(teacherUsers.map((u) => [u.id, u.name]));

  const teacherPerformance = teachers.map((t) => {
    const groupSummaries = t.groupId ? summariesByGroupId.get(t.groupId) || [] : [];
    const avg =
      groupSummaries.length > 0
        ? Math.round(
            groupSummaries.reduce((sum, s) => sum + s.examReadiness, 0) / groupSummaries.length
          )
        : 0;
    return {
      membershipId: t.id,
      name: teacherNameById.get(t.userId) || "—",
      groupId: t.groupId,
      studentCount: groupSummaries.length,
      avgReadiness: avg,
    };
  });

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

  // Maktab reytingi — o'rtacha tayyorgarlik bo'yicha.
  //
  // ENG OG'IR N+1 SHU YERDA EDI: har bir faol maktab uchun alohida
  // membership so'rovi + har bir talaba uchun 3 ta so'rov. 50 maktab x 100
  // talaba = 15 000+ so'rov, CEO dashboardi ochilganda. Endi: barcha faol
  // talabalar BITTA so'rovda olinadi, so'ng bitta batch summarize.
  const activeSchoolRows = await prisma.school.findMany({ where: { status: "ACTIVE" } });

  let rankings = [];
  if (activeSchoolRows.length > 0) {
    const allStudents = await prisma.membership.findMany({
      where: {
        schoolId: { in: activeSchoolRows.map((s) => s.id) },
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    const allSummaries = await summarizeStudents(allStudents);

    // membershipId -> schoolId xaritasi orqali summary'larni maktabga bog'laymiz
    const schoolIdByMembershipId = new Map(allStudents.map((m) => [m.id, m.schoolId]));
    const totalsBySchool = new Map(); // schoolId -> { sum, count }
    for (const summary of allSummaries) {
      const schoolId = schoolIdByMembershipId.get(summary.membershipId);
      if (schoolId == null) continue;
      const entry = totalsBySchool.get(schoolId) || { sum: 0, count: 0 };
      entry.sum += summary.examReadiness;
      entry.count += 1;
      totalsBySchool.set(schoolId, entry);
    }

    rankings = activeSchoolRows.map((school) => {
      const entry = totalsBySchool.get(school.id);
      return {
        schoolId: school.id,
        name: school.name,
        studentCount: entry?.count ?? 0,
        avgReadiness: entry && entry.count > 0 ? Math.round(entry.sum / entry.count) : 0,
      };
    });
    rankings.sort((a, b) => b.avgReadiness - a.avgReadiness);
  }

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
