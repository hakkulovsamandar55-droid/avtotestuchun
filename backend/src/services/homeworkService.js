import { prisma } from "../db.js";
import { TOTAL_TICKETS } from "../../../shared/data/ticketsData.js";
import { CATEGORIES as SIGN_CATEGORIES } from "../../../shared/data/signsData.js";

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
export async function createHomework(
  schoolId,
  groupId,
  createdById,
  { title, type, params, minScore, deadline, targetMembershipIds }
) {
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

  // PARAMS VALIDATSIYASI.
  //
  // NIMA UCHUN KERAK: avval params tekshirilmasdan JSON.stringify qilinardi.
  // O'qituvchi 999-biletni yoki mavjud bo'lmagan belgi toifasini ko'rsatsa,
  // vazifa YARATILARDI lekin uni BAJARISH IMKONSIZ bo'lardi — talaba
  // bunday biletni topa olmaydi, submission esa muddat tugagach MISSED
  // bo'lib, talaba aybdor bo'lib chiqardi.
  const cleanParams = validateParams(type, params);

  const homework = await prisma.homework.create({
    data: {
      schoolId,
      groupId,
      createdById,
      title: title.trim(),
      type,
      params: JSON.stringify(cleanParams),
      minScore: minScore ?? null,
      deadline: deadlineDate,
      isTargeted: Array.isArray(targetMembershipIds) && targetMembershipIds.length > 0,
    },
  });

  // Kimga beriladi?
  //
  // MAQSADLI vazifa: faqat tanlangan talabalar. O'qituvchi talaba profilida
  // zaiflikni ko'rib, aynan o'sha odamga vazifa berishi mumkin bo'lishi kerak.
  //
  // MUHIM: tanlangan ID'lar ROSTDAN HAM shu guruhning faol talabalari
  // ekanini tekshiramiz. Aks holda o'qituvchi boshqa guruh (yoki boshqa
  // maktab) talabasining membershipId sini yozib, unga vazifa "ilib"
  // qo'yishi mumkin bo'lardi.
  const groupStudents = await prisma.membership.findMany({
    where: { groupId, role: "STUDENT", status: "ACTIVE" },
    select: { id: true },
  });
  const allowedIds = new Set(groupStudents.map((m) => m.id));

  let recipients;
  if (homework.isTargeted) {
    const requested = [...new Set(targetMembershipIds.map(Number))];
    recipients = requested.filter((id) => allowedIds.has(id));
    if (recipients.length === 0) {
      // Yaratilgan vazifani qoldirib ketmaymiz — hech kimga tegishli bo'lmagan
      // vazifa ma'lumot bazasida axlat bo'lib qoladi va o'qituvchi ro'yxatida
      // "0 talaba" bo'lib chalkashtiradi.
      await prisma.homework.delete({ where: { id: homework.id } });
      throw new HomeworkError(
        "invalid_input",
        "Tanlangan talabalar bu guruhda topilmadi"
      );
    }
  } else {
    recipients = [...allowedIds];
  }

  // createMany — bitta so'rov. skipDuplicates unique cheklovga
  // (homeworkId + membershipId) urilishdan himoya qiladi.
  if (recipients.length > 0) {
    await prisma.homeworkSubmission.createMany({
      data: recipients.map((membershipId) => ({
        homeworkId: homework.id,
        membershipId,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });
  }

  return homework;
}

/**
 * Yangi talaba guruhga qo'shilganda, guruhning tugamagan vazifalariga yoziladi.
 *
 * MUHIM: MAQSADLI vazifalar (isTargeted) TASHLAB KETILADI. Ular aynan
 * tanlangan talabalar uchun yaratilgan — masalan o'qituvchi zaif talabaga
 * qo'shimcha mashq bergan. Yangi kelgan odamni unga yozish mantiqsiz:
 * u vazifani bajarmagan bo'lib chiqadi va statistikasi asossiz buziladi.
 */
export async function enrollMembershipInGroupHomeworks(membershipId, groupId) {
  const openHomeworks = await prisma.homework.findMany({
    where: { groupId, deadline: { gt: new Date() }, isTargeted: false },
    select: { id: true },
  });
  if (openHomeworks.length === 0) return;

  // createMany — bitta so'rov. skipDuplicates: talaba avval shu guruhda
  // bo'lib, qaytib kelgan bo'lsa submission allaqachon bor bo'lishi mumkin.
  await prisma.homeworkSubmission.createMany({
    data: openHomeworks.map((hw) => ({
      homeworkId: hw.id,
      membershipId,
      status: "PENDING",
    })),
    skipDuplicates: true,
  });
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
export async function recordAttemptForHomework(
  userId,
  { type, score, attemptId, examAttemptId, ticketNumber, signsCategory }
) {
  try {
    const membership = await prisma.membership.findFirst({
      where: { userId, status: "ACTIVE", role: "STUDENT" },
    });
    if (!membership) return null; // talaba hech qanday maktabga a'zo emas

    // MUHIM TUZATISH — LATE/MISSED nomuvofiqligi.
    //
    // AVVAL: bu so'rov faqat PENDING submission'larni olardi. Ammo
    // expireOverdueSubmissions() muddati o'tganlarni MISSED qilib qo'yadi va
    // u o'qituvchi ro'yxatni ochganda ishga tushadi. Natijada talabaning
    // holati O'QITUVCHI SAHIFANI QACHON OCHGANIGA bog'liq bo'lardi:
    //   - o'qituvchi ochmagan bo'lsa  -> submission PENDING -> LATE beriladi
    //   - o'qituvchi ochgan bo'lsa    -> submission MISSED  -> hech nima
    // Bir xil harakat uchun ikki xil natija — bu mantiqsiz.
    //
    // ENDI: MISSED ham hisobga olinadi. Muddatdan keyin bajarilgan ish
    // har doim LATE bo'ladi, kim qachon nimaga qaraganidan qat'i nazar.
    const candidates = await prisma.homeworkSubmission.findMany({
      where: { membershipId: membership.id, status: { in: ["PENDING", "MISSED"] } },
      orderBy: { createdAt: "asc" },
    });
    if (candidates.length === 0) return null;

    // N+1 EMAS: barcha vazifalar bitta so'rovda olinadi.
    // Avval har submission uchun alohida findUnique yuborilardi.
    const homeworks = await prisma.homework.findMany({
      where: { id: { in: candidates.map((c) => c.homeworkId) } },
    });
    const hwById = new Map(homeworks.map((h) => [h.id, h]));

    const now = new Date();
    const closed = [];

    for (const sub of candidates) {
      const homework = hwById.get(sub.homeworkId);
      if (!homework || !isMatchingHomeworkType(homework, type, ticketNumber, signsCategory)) continue;

      // Minimal ball talabi bo'lsa va unga yetmasa — bajarilgan deb
      // hisoblanmaydi, submission holicha qoladi (talaba qayta urinishi mumkin).
      if (homework.minScore != null && score != null && score < homework.minScore) {
        continue;
      }

      const isLate = now > homework.deadline;
      const updated = await prisma.homeworkSubmission.update({
        where: { id: sub.id },
        data: {
          status: isLate ? "LATE" : "COMPLETED",
          score: score ?? null,
          attemptId: attemptId ?? null,
          examAttemptId: examAttemptId ?? null,
          completedAt: now,
        },
      });
      closed.push(updated);
    }

    // BARCHA mos vazifalar yopiladi, bittasi emas.
    //
    // AVVAL: `return updated` bilan birinchi mos vazifada to'xtardi. Agar
    // talabaga bir vaqtda "12-biletni ishla" va "istalgan mashq qil" degan
    // ikki vazifa berilgan bo'lsa, u 12-biletni ishlaganda IKKALASI ham
    // haqiqatan bajarilgan bo'ladi — lekin faqat bittasi yopilardi va
    // ikkinchisi muddat tugagach MISSED bo'lib, talaba aybdor ko'rinardi.
    return closed.length > 0 ? closed[0] : null;
  } catch (err) {
    // Hook xatosi asosiy oqimni (masalan imtihon topshirishni) buzmasligi kerak
    console.error("Homework hook xatosi:", err);
    return null;
  }
}

function isMatchingHomeworkType(homework, attemptType, ticketNumber, signsCategory) {
  if (homework.type === "OFFICIAL_EXAM") return attemptType === "OFFICIAL_EXAM";
  if (homework.type === "PRACTICE") return attemptType === "PRACTICE" || attemptType === "TICKETS";
  if (homework.type === "TICKETS") {
    if (attemptType !== "TICKETS") return false;
    const params = parseParams(homework.params);
    const wanted = Array.isArray(params.ticketNumbers) ? params.ticketNumbers : null;
    return !wanted || (ticketNumber != null && wanted.includes(ticketNumber));
  }
  if (homework.type === "SIGNS") {
    if (attemptType !== "SIGNS") return false;
    // Toifa ko'rsatilgan bo'lsa, talaba AYNAN shu toifadan test ishlashi kerak.
    // Aks holda "ogohlantiruvchi belgilarni o'rgan" vazifasini xizmat
    // belgilaridan test ishlab yopib qo'yish mumkin bo'lardi.
    const params = parseParams(homework.params);
    if (!params.category) return true; // barcha toifalar
    return signsCategory === params.category;
  }
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

/**
 * Vazifa parametrlarini tekshiradi va tozalaydi.
 *
 * Har bir tur uchun o'z qoidasi:
 *   TICKETS — ticketNumbers: mavjud bilet raqamlari (1..TOTAL_TICKETS)
 *   SIGNS   — category: mavjud belgi toifasi yoki null (barcha belgilar)
 *   PRACTICE / OFFICIAL_EXAM — parametr talab qilinmaydi
 */
function validateParams(type, params) {
  const p = params && typeof params === "object" ? params : {};

  if (type === "TICKETS") {
    const raw = Array.isArray(p.ticketNumbers) ? p.ticketNumbers : [];
    const nums = [...new Set(raw.map(Number))].filter(
      (n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_TICKETS
    );
    if (nums.length === 0) {
      throw new HomeworkError(
        "invalid_input",
        `Kamida bitta bilet tanlanishi kerak (1-${TOTAL_TICKETS})`
      );
    }
    return { ticketNumbers: nums.sort((a, b) => a - b) };
  }

  if (type === "SIGNS") {
    // null = barcha toifalar. Aks holda toifa mavjud bo'lishi shart.
    const cat = p.category ?? null;
    if (cat !== null && !SIGN_CATEGORIES.includes(cat)) {
      throw new HomeworkError("invalid_input", "Noto'g'ri belgi toifasi");
    }
    const count = Number(p.questionCount) || 15;
    if (!Number.isInteger(count) || count < 5 || count > 50) {
      throw new HomeworkError("invalid_input", "Savol soni 5-50 oralig'ida bo'lishi kerak");
    }
    return { category: cat, questionCount: count };
  }

  return {};
}
