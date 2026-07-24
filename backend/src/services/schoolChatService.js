import { prisma } from "../db.js";

// ============================================================================
// MAKTAB CHATI — o'qituvchi ↔ talaba yozishuvi
//
// XAVFSIZLIK MODELI (eng muhim qism):
//   - O'qituvchi FAQAT o'z guruhidagi talabalar bilan yozisha oladi
//   - Talaba FAQAT o'z guruhining o'qituvchisi bilan yozisha oladi
//   - Owner o'z maktabidagi har kim bilan yozisha oladi
//   - Maktablar o'rtasida hech qanday ko'rinish yo'q
//
// Chat membershipId orqali bog'lanadi (userId emas) — odam maktabdan chiqsa,
// a'zoligi ARCHIVED bo'ladi va tarix o'sha maktabga tegishli qoladi.
// ============================================================================

export class ChatError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const MAX_MESSAGE_LENGTH = 2000;

function notFound(what) {
  return new ChatError("not_found", `${what} topilmadi`);
}

function forbidden(message) {
  return new ChatError("forbidden", message);
}

/**
 * Ikki a'zo o'rtasida yozishuvga ruxsat bormi.
 *
 * Bu funksiya butun chat tizimining xavfsizlik markazi — har bir chat
 * yaratish va xabar yuborishdan oldin chaqiriladi.
 */
function canConverse(a, b) {
  if (a.schoolId !== b.schoolId) return false;
  if (a.status !== "ACTIVE" || b.status !== "ACTIVE") return false;
  if (a.id === b.id) return false;

  // Owner maktabdagi har kim bilan yozisha oladi
  if (a.role === "OWNER" || b.role === "OWNER") return true;

  // Qolgan holatda: bittasi o'qituvchi, bittasi talaba VA bir guruhda
  const roles = [a.role, b.role].sort().join("-");
  if (roles !== "STUDENT-TEACHER") return false;

  // Guruh mosligini tekshiramiz. groupId null bo'lsa yozishuv mumkin emas —
  // aks holda guruhsiz o'qituvchi guruhsiz talabalar bilan yozishardi.
  if (a.groupId == null || b.groupId == null) return false;
  return a.groupId === b.groupId;
}

/**
 * Chat topadi yoki yaratadi.
 *
 * Poyga holati: ikki tomon bir vaqtda yozsa, ikkita chat yaratilishi mumkin
 * edi. DB'dagi @@unique([studentMembershipId, teacherMembershipId]) buni
 * to'sadi — P2002 xatosini ushlab, mavjud chatni qaytaramiz.
 */
export async function getOrCreateChat(schoolId, membershipA, membershipB) {
  if (!canConverse(membershipA, membershipB)) {
    throw forbidden("Bu foydalanuvchi bilan yozishish huquqingiz yo'q");
  }

  // Kim talaba, kim o'qituvchi — jadval strukturasi shuni talab qiladi.
  // Owner ishtirok etsa, u "teacher" tomonida turadi.
  let student, teacher;
  if (membershipA.role === "STUDENT") {
    student = membershipA;
    teacher = membershipB;
  } else if (membershipB.role === "STUDENT") {
    student = membershipB;
    teacher = membershipA;
  } else {
    // Ikkalasi ham OWNER/TEACHER — hozircha qo'llab-quvvatlanmaydi
    throw forbidden("Xodimlar o'rtasidagi yozishuv hozircha mavjud emas");
  }

  const existing = await prisma.schoolChat.findUnique({
    where: {
      studentMembershipId_teacherMembershipId: {
        studentMembershipId: student.id,
        teacherMembershipId: teacher.id,
      },
    },
  });
  if (existing) return existing;

  try {
    return await prisma.schoolChat.create({
      data: {
        schoolId,
        studentMembershipId: student.id,
        teacherMembershipId: teacher.id,
      },
    });
  } catch (err) {
    // Poyga: boshqa so'rov bizdan oldin yaratdi
    if (err?.code === "P2002") {
      const chat = await prisma.schoolChat.findUnique({
        where: {
          studentMembershipId_teacherMembershipId: {
            studentMembershipId: student.id,
            teacherMembershipId: teacher.id,
          },
        },
      });
      if (chat) return chat;
    }
    throw err;
  }
}

/**
 * Foydalanuvchining chatlari ro'yxati.
 *
 * N+1 EMAS: chatlar, suhbatdoshlar va foydalanuvchi ma'lumotlari jami
 * 3 ta so'rovda olinadi. O'qilmagan xabarlar soni chat qatorida saqlanadi,
 * shuning uchun qo'shimcha COUNT so'rovlari kerak emas.
 */
export async function listChats(membership) {
  const isStudent = membership.role === "STUDENT";

  const chats = await prisma.schoolChat.findMany({
    where: isStudent
      ? { studentMembershipId: membership.id }
      : { teacherMembershipId: membership.id },
    orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
    take: 100,
  });

  if (chats.length === 0) return [];

  // Suhbatdoshlarning membership yozuvlari
  const otherIds = chats.map((c) =>
    isStudent ? c.teacherMembershipId : c.studentMembershipId
  );
  const others = await prisma.membership.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, userId: true, role: true, status: true },
  });
  const otherById = new Map(others.map((m) => [m.id, m]));

  // Ularning foydalanuvchi ma'lumotlari
  const users = await prisma.user.findMany({
    where: { id: { in: others.map((m) => m.userId) } },
    select: { id: true, name: true, avatarUrl: true, lastOnlineAt: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return chats.map((chat) => {
    const otherId = isStudent ? chat.teacherMembershipId : chat.studentMembershipId;
    const other = otherById.get(otherId);
    const user = other ? userById.get(other.userId) : null;

    return {
      id: chat.id,
      lastMessageAt: chat.lastMessageAt,
      lastMessageText: chat.lastMessageText,
      unreadCount: isStudent ? chat.unreadForStudent : chat.unreadForTeacher,
      other: {
        membershipId: otherId,
        // Suhbatdosh o'chirilgan bo'lsa ham chat ko'rinishi kerak —
        // xabar tarixi yo'qolmasligi uchun xavfsiz standart qiymatlar
        name: user?.name ?? "—",
        avatarUrl: user?.avatarUrl ?? null,
        lastOnlineAt: user?.lastOnlineAt ?? null,
        role: other?.role ?? null,
        isActive: other?.status === "ACTIVE",
      },
    };
  });
}

/**
 * Chat xabarlarini olish. Sahifalash `before` (xabar ID) orqali —
 * offset'dan tezroq va yangi xabar kelganda dublikat bermaydi.
 */
export async function getMessages(chatId, membership, { limit = 50, before } = {}) {
  const chat = await assertChatAccess(chatId, membership);

  const where = { chatId };
  if (before != null) where.id = { lt: before };

  const messages = await prisma.schoolMessage.findMany({
    where,
    orderBy: { id: "desc" },
    take: Math.min(limit, 100),
  });

  // Eng eskisi birinchi bo'lib qaytadi — UI shunday kutadi
  messages.reverse();

  return { chat, messages };
}

/**
 * Xabar yuborish.
 *
 * Tranzaksiya ichida: xabar yoziladi, chat metadata yangilanadi,
 * o'qilmaganlar soni oshiriladi. Bularning bir qismi bajarilib, boshqasi
 * bajarilmasligi mumkin emas.
 */
export async function sendMessage(chatId, membership, rawText) {
  const text = typeof rawText === "string" ? rawText.trim() : "";
  if (!text) {
    throw new ChatError("invalid_input", "Xabar bo'sh bo'lishi mumkin emas");
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new ChatError(
      "invalid_input",
      `Xabar juda uzun (maksimum ${MAX_MESSAGE_LENGTH} belgi)`
    );
  }

  const chat = await assertChatAccess(chatId, membership);
  const isStudent = chat.studentMembershipId === membership.id;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.schoolMessage.create({
      data: {
        chatId,
        senderMembershipId: membership.id,
        text,
      },
    });

    await tx.schoolChat.update({
      where: { id: chatId },
      data: {
        lastMessageAt: created.createdAt,
        // Ro'yxatda ko'rsatish uchun qisqartma — to'liq matn xabarlar
        // jadvalida qoladi
        lastMessageText: text.slice(0, 120),
        // Qabul qiluvchining o'qilmaganlari oshadi
        ...(isStudent
          ? { unreadForTeacher: { increment: 1 } }
          : { unreadForStudent: { increment: 1 } }),
      },
    });

    return created;
  });

  // Bildirishnoma — ASOSIY amalni buzmasligi kerak, shuning uchun
  // tranzaksiyadan tashqarida va try/catch ichida.
  notifyRecipient(chat, membership, text).catch((err) => {
    console.error("[school-chat] bildirishnoma yuborilmadi:", err?.message || err);
  });

  return message;
}

/**
 * Chatni o'qilgan deb belgilash.
 * Idempotent — bir necha marta chaqirilsa ham xavfsiz.
 */
export async function markAsRead(chatId, membership) {
  const chat = await assertChatAccess(chatId, membership);
  const isStudent = chat.studentMembershipId === membership.id;

  await prisma.$transaction([
    prisma.schoolMessage.updateMany({
      where: {
        chatId,
        senderMembershipId: { not: membership.id },
        isRead: false,
      },
      data: { isRead: true },
    }),
    prisma.schoolChat.update({
      where: { id: chatId },
      data: isStudent ? { unreadForStudent: 0 } : { unreadForTeacher: 0 },
    }),
  ]);

  return { ok: true };
}

/**
 * Foydalanuvchining barcha chatlaridagi jami o'qilmagan xabarlar.
 * Tab'dagi qizil nuqta uchun — bitta agregat so'rov.
 */
export async function getTotalUnread(membership) {
  const isStudent = membership.role === "STUDENT";
  const result = await prisma.schoolChat.aggregate({
    where: isStudent
      ? { studentMembershipId: membership.id }
      : { teacherMembershipId: membership.id },
    _sum: isStudent ? { unreadForStudent: true } : { unreadForTeacher: true },
  });
  const sum = isStudent ? result._sum?.unreadForStudent : result._sum?.unreadForTeacher;
  return sum || 0;
}

// ---- ichki yordamchilar ----

/**
 * Chat mavjudligini VA foydalanuvchi unga a'zo ekanini tekshiradi.
 * Har bir chat amali shu tekshiruvdan o'tadi.
 */
async function assertChatAccess(chatId, membership) {
  const chat = await prisma.schoolChat.findUnique({ where: { id: chatId } });
  if (!chat) throw notFound("Chat");

  // Maktab mosligi — boshqa maktab chatiga kirishni to'sadi
  if (chat.schoolId !== membership.schoolId) throw notFound("Chat");

  const isParticipant =
    chat.studentMembershipId === membership.id || chat.teacherMembershipId === membership.id;

  // Owner o'z maktabidagi chatlarni ko'ra oladi (nazorat uchun)
  if (!isParticipant && membership.role !== "OWNER") {
    throw forbidden("Bu chatga kirish huquqingiz yo'q");
  }

  return chat;
}

async function notifyRecipient(chat, sender, text) {
  const recipientMembershipId =
    chat.studentMembershipId === sender.id ? chat.teacherMembershipId : chat.studentMembershipId;

  const [recipient, senderUser] = await Promise.all([
    prisma.membership.findUnique({
      where: { id: recipientMembershipId },
      select: { userId: true, status: true },
    }),
    prisma.user.findUnique({ where: { id: sender.userId }, select: { name: true } }),
  ]);

  if (!recipient || recipient.status !== "ACTIVE") return;

  await prisma.notification.create({
    data: {
      userId: recipient.userId,
      type: "SCHOOL_MESSAGE",
      title: senderUser?.name || "Yangi xabar",
      body: text.slice(0, 100),
      linkType: "school_chat",
      linkId: chat.id,
    },
  });
}
