import { prisma } from "../db.js";
import { getQuestionsByIds } from "../../../shared/data/officialExam.js";

// ============================================================================
// UY VAZIFALARI (Homework)
//
// Homework <-> mavjud test tizimlari integratsiyasi shu yerda.
// Kod TAKRORLANMAYDI: Homework yangi test dvigateli emas, balki mavjud
// Attempt (mashq) va ExamAttempt (rasmiy imtihon) natijalarini KUZATADI.
//
// Oqim:
//   1) O'qituvchi homework yaratadi (masalan "5, 12, 18-biletlarni yeching")
//   2) Har bir talaba uchun HomeworkSubmission(PENDING) avtomatik yaratiladi
//   3) Talaba mashq/imtihon topshiradi -> examService/stats.js natija yozgach,
//      recordAttemptForHomework() chaqiriladi -> mos submission COMPLETED/LATE bo'ladi
//
// Bu "hook" yondashuvi — Homework mavjud Attempt/ExamAttempt oqimiga
// MINIMAL o'zgarish bilan ulanadi, ularning ichki mantiqini takrorlamaydi.
// ============================================================================

class HomeworkError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
function notFound(what) {
  return new HomeworkError("not_found", `${what} topilmadi`);
}

function parseParams(raw) {
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

/** O'qituvchi yangi homework yaratadi va guruhdagi barcha faol talabalar uchun PENDING submission ochadi. */
export async function createHomework(schoolId, groupId, createdById, { title, type, params, minScore, deadline }) {
  if (!title || !title.trim()) throw new HomeworkError("invalid_input", "Sarlavha kiritilishi shart");
  if (!["PRACTICE", "OFFICIAL_EXAM", "TICKETS", "SIGNS"].includes(type)) {
    throw new HomeworkError("invalid_input", "Noto'g'ri homework turi");
  }
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    throw new HomeworkError("invalid_input", "Muddat kelajakda bo'lishi kerak");
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.schoolId !== schoolId) throw notFound("Guruh");

  const homework = await prisma.homework.create({
    data: {
      schoolId,
      groupId,
      createdById,
      title: title.trim(),
      type,
      params: JSON.stringify(params || {}),
      minScore: minScore ?? null,
      deadline: deadlineDate,
    },
  });

  // Guruhdagi barcha faol talabalar uchun darhol PENDING submission yaratamiz.
  // Bu o'qituvchiga "kim hali bajarmagan" ro'yxatini so'rovsiz ko'rsatish imkonini beradi.
  const students = await prisma.membership.findMany({
    where: { groupId, role: "STUDENT", status: "ACTIVE" },
  });

  await Promise.all(
    students.map((s) =>
      prisma.homeworkSubmission.create({
        data: { homeworkId: homework.id, membershipId: s.id, status: "PENDING" },
      })
    )
  );

  return homework;
}

/** Yangi talaba guruhga qo'shilganda, guruhning tugamagan homeworklariga ham qo'shiladi. */
export async function enrollMembershipInGroupHomeworks(membershipId, groupId) {
  const openHomeworks = await prisma.homework.findMany({
    where: { groupId, deadline: { gt: new Date() } },
  });
  await Promise.all(
    openHomeworks.map((hw) =>
      prisma.homeworkSubmission.create({
        data: { homeworkId: hw.id, membershipId, status: "PENDING" },
      })
    )
  );
}

/** O'qituvchi/Owner: guruhning barcha homeworklari + bajarilish foizi. */
export async function listGroupHomework(groupId) {
  const homeworks = await prisma.homework.findMany({
    where: { groupId },
    orderBy: { deadline: "desc" },
  });

  return Promise.all(
    homeworks.map(async (hw) => {
      const [total, completed, late] = await Promise.all([
        prisma.homeworkSubmission.count({ where: { homeworkId: hw.id } }),
        prisma.homeworkSubmission.count({ where: { homeworkId: hw.id, status: "COMPLETED" } }),
        prisma.homeworkSubmission.count({ where: { homeworkId: hw.id, status: "LATE" } }),
      ]);
      return { ...hw, params: parseParams(hw.params), stats: { total, completed, late } };
    })
  );
}

/** Talabaning o'z homeworklari (joriy maktabidagi). */
export async function listMyHomework(membershipId) {
  const submissions = await prisma.homeworkSubmission.findMany({
    where: { membershipId },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    submissions.map(async (sub) => {
      const homework = await prisma.homework.findUnique({ where: { id: sub.homeworkId } });
      return { ...sub, homework: { ...homework, params: parseParams(homework.params) } };
    })
  );
}

// ============================================================================
// AVTOMATIK BELGILASH — mavjud test oqimlari bilan integratsiya
// ============================================================================

/**
 * Mos submission borligini tekshiradi va uni yakunlaydi.
 *
 * Chaqiriladi:
 *   - examService.finalizeAttempt dan keyin (type=OFFICIAL_EXAM homeworklar uchun)
 *   - stats.js /attempt dan keyin (type=PRACTICE/TICKETS homeworklar uchun)
 *
 * Talabaning ushbu turdagi ENG ESKI tugallanmagan (PENDING) homeworkini
 * topib yakunlaydi — bir nechta mos homework bo'lsa, eng muddati yaqinini
 * emas, birinchi yaratilganini yopamiz (FIFO, tushunarli va bashorat qilinadigan).
 *
 * Bu funksiya xato tashlamaydi — agar talaba biror maktabga a'zo bo'lmasa
 * yoki mos homework bo'lmasa, jimgina hech narsa qilmaydi. Sabab: bu hook
 * asosiy oqimning (test topshirish) muvaffaqiyatini blok qilmasligi kerak.
 */
export async function recordAttemptForHomework(userId, { type, score, attemptId, examAttemptId, ticketNumber }) {
  try {
    const membership = await prisma.membership.findFirst({
      where: { userId, status: "ACTIVE", role: "STUDENT" },
    });
    if (!membership) return null; // talaba hech qanday maktabga a'zo emas

    const candidates = await prisma.homeworkSubmission.findMany({
      where: { membershipId: membership.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (candidates.length === 0) return null;

    for (const sub of candidates) {
      const homework = await prisma.homework.findUnique({ where: { id: sub.homeworkId } });
      if (!homework || !isMatchingHomeworkType(homework, type, ticketNumber)) continue;

      // Minimal ball talabi bo'lsa va unga yetmasa — bajarilgan deb hisoblanmaydi,
      // submission PENDING holida qoladi (talaba qayta urinishi mumkin).
      if (homework.minScore != null && score != null && score < homework.minScore) {
        continue;
      }

      const isLate = new Date() > homework.deadline;
      const updated = await prisma.homeworkSubmission.update({
        where: { id: sub.id },
        data: {
          status: isLate ? "LATE" : "COMPLETED",
          score: score ?? null,
          attemptId: attemptId ?? null,
          examAttemptId: examAttemptId ?? null,
          completedAt: new Date(),
        },
      });
      return updated; // bir martada faqat bitta homework yopiladi
    }

    return null;
  } catch (err) {
    // Hook xatosi asosiy oqimni (masalan imtihon topshirishni) buzmasligi kerak
    console.error("Homework hook xatosi:", err);
    return null;
  }
}

// MUHIM: bu funksiyaga keladigan `attemptType` mavjud AttemptType enumidan
// EMAS — u chaqiruvchi tomonidan quyidagicha normallashtiriladi:
//   stats.js (mashq: bilet)      -> "TICKETS"
//   stats.js (mashq: erkin/aralash) -> "PRACTICE"
//   examService.js (rasmiy imtihon) -> "OFFICIAL_EXAM"
// Bu normalizatsiya shu yerda emas, chaqiruvchi joyda qilinadi, chunki har
// bir chaqiruvchi o'zining kontekstini (TICKET vs EXAM enum qiymati) biladi.
function isMatchingHomeworkType(homework, attemptType, ticketNumber) {
  if (homework.type === "OFFICIAL_EXAM") return attemptType === "OFFICIAL_EXAM";
  if (homework.type === "PRACTICE") return attemptType === "PRACTICE" || attemptType === "TICKETS";
  if (homework.type === "TICKETS") {
    if (attemptType !== "TICKETS") return false;
    const params = parseParams(homework.params);
    const wanted = Array.isArray(params.ticketNumbers) ? params.ticketNumbers : null;
    return !wanted || (ticketNumber != null && wanted.includes(ticketNumber));
  }
  if (homework.type === "SIGNS") return attemptType === "SIGNS";
  return false;
}

/**
 * Muddati o'tgan, hali PENDING bo'lgan submissionlarni MISSED qiladi.
 * Lazy: alohida cron kerak emas — o'qituvchi ro'yxatni ochganda chaqiriladi.
 */
export async function expireOverdueSubmissions(groupId) {
  const overdueHomeworks = await prisma.homework.findMany({
    where: { groupId, deadline: { lt: new Date() } },
  });
  for (const hw of overdueHomeworks) {
    await prisma.homeworkSubmission.updateMany({
      where: { homeworkId: hw.id, status: "PENDING" },
      data: { status: "MISSED" },
    });
  }
}

export { HomeworkError };
