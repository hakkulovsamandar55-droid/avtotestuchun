import { prisma } from "../db.js";

// User Profile'dagi timeline'ga yozadi.
//
// MUHIM: bu yordamchi (audit) yozuv — u hech qachon asosiy amaliyotni
// buzmasligi kerak. Ilgari xato bo'lganda butun so'rov 500 qaytarardi:
// masalan maktab tasdiqlanib bo'lgan, lekin ActivityType enum'ida qiymat
// yo'qligi sababli foydalanuvchi yolg'on "Server xatosi" ko'rardi.
// Endi xato faqat log'ga yoziladi va oqim davom etadi.
export async function logActivity(userId, type, message, metadata) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[logActivity] yozib bo'lmadi:", { userId, type }, err);
    return null;
  }
}

// Admin panelidagi Admin Log bo'limiga yozadi (kim, nima, kimga).
// logActivity bilan bir xil sabab bo'yicha fail-safe.
export async function logAdminAction(actorId, action, { targetUserId, targetLabel, details } = {}) {
  try {
    return await prisma.adminLog.create({
      data: { actorId, action, targetUserId, targetLabel, details },
    });
  } catch (err) {
    console.error("[logAdminAction] yozib bo'lmadi:", { actorId, action }, err);
    return null;
  }
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
