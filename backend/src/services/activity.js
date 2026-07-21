import { prisma } from "../db.js";

// User Profile'dagi timeline'ga yozadi
export function logActivity(userId, type, message, metadata) {
  return prisma.activityLog.create({
    data: {
      userId,
      type,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// Admin panelidagi Admin Log bo'limiga yozadi (kim, nima, kimga)
export function logAdminAction(actorId, action, { targetUserId, targetLabel, details } = {}) {
  return prisma.adminLog.create({
    data: { actorId, action, targetUserId, targetLabel, details },
  });
}

// Barcha adminlarga bildirishnoma yuboradi (masalan yangi support xabari yoki to'lov so'rovi
// paydo bo'lganda) — har bir admin uchun alohida Notification yozuvi yaratiladi,
// shunda har kim o'zining o'qilgan/o'qilmagan holatini alohida ko'radi.
export async function notifyAllAdmins({ type, title, body, linkType, linkId }) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type,
      title,
      body,
      linkType,
      linkId,
    })),
  });
}
