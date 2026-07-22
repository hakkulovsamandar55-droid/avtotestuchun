import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../authMiddleware.js";
import { loadCurrentUser, requireAdminUser } from "../services/userState.js";
import { asyncHandler } from "../asyncHandler.js";
import { uploadImage, publicUrlFor } from "../lib/upload.js";
import { logActivity, logAdminAction, notifyAllAdmins } from "../services/activity.js";
import { requireIdParam } from "../lib/validate.js";

export const supportRouter = Router();

function serializeMessage(m) {
  return {
    id: m.id,
    sender: m.sender,
    text: m.text,
    imageUrl: m.imageUrl,
    isRead: m.isRead,
    createdAt: m.createdAt,
  };
}

async function getOrCreateConversation(userId) {
  let conv = await prisma.conversation.findUnique({ where: { userId } });
  if (!conv) {
    conv = await prisma.conversation.create({ data: { userId } });
  }
  return conv;
}

// ============================== FOYDALANUVCHI TOMONI ==============================

// GET /api/support/conversation — o'z suhbatini (va xabarlarini) olish
supportRouter.get("/conversation", requireAuth, loadCurrentUser, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const conv = await getOrCreateConversation(userId);

  const messages = await prisma.supportMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
  });

  // Foydalanuvchi chatni ochganda, admin yuborgan xabarlar "o'qilgan" deb belgilanadi
  await prisma.supportMessage.updateMany({
    where: { conversationId: conv.id, sender: "ADMIN", isRead: false },
    data: { isRead: true },
  });
  await prisma.conversation.update({ where: { id: conv.id }, data: { unreadForUser: 0 } });

  res.json({
    status: conv.status,
    messages: messages.map(serializeMessage),
  });
}));

// POST /api/support/message  { text? }  — matnli xabar yuborish
supportRouter.post("/message", requireAuth, loadCurrentUser, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Xabar matni bo'sh bo'lmasligi kerak" });
  }

  const conv = await getOrCreateConversation(userId);
  const message = await prisma.supportMessage.create({
    data: { conversationId: conv.id, sender: "USER", text: text.trim() },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: {
      status: "OPEN", // foydalanuvchi yozganda suhbat avtomatik qayta ochiladi
      lastMessageAt: new Date(),
      unreadForAdmin: { increment: 1 },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyAllAdmins({
    type: "SUPPORT_MESSAGE",
    title: "Yangi xabar",
    body: `${user?.name || "Foydalanuvchi"}: ${text.trim().slice(0, 80)}`,
    linkType: "conversation",
    linkId: conv.id,
  });

  res.status(201).json({ message: serializeMessage(message) });
}));

// POST /api/support/message/image  (multipart, field: "image") — rasm/screenshot yuborish
supportRouter.post("/message/image", requireAuth, loadCurrentUser, uploadImage.single("image"), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    return res.status(400).json({ error: "Rasm fayli topilmadi" });
  }

  const conv = await getOrCreateConversation(userId);
  const message = await prisma.supportMessage.create({
    data: { conversationId: conv.id, sender: "USER", imageUrl: publicUrlFor(req.file.filename) },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { status: "OPEN", lastMessageAt: new Date(), unreadForAdmin: { increment: 1 } },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await notifyAllAdmins({
    type: "SUPPORT_MESSAGE",
    title: "Yangi rasm",
    body: `${user?.name || "Foydalanuvchi"} rasm yubordi`,
    linkType: "conversation",
    linkId: conv.id,
  });

  res.status(201).json({ message: serializeMessage(message) });
}));

// ============================== ADMIN TOMONI ==============================

const adminSupport = Router();
adminSupport.use(requireAuth, loadCurrentUser, requireAdminUser);

// GET /api/admin/support/conversations?status=OPEN|CLOSED&query=...
adminSupport.get("/conversations", asyncHandler(async (req, res) => {
  const { status, query } = req.query;
  const conversations = await prisma.conversation.findMany({
    where: {
      status: status === "OPEN" || status === "CLOSED" ? status : undefined,
      user: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
    },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true, telegramId: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    take: 100,
  });

  res.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      status: c.status,
      unreadForAdmin: c.unreadForAdmin,
      lastMessageAt: c.lastMessageAt,
      user: {
        ...c.user,
        telegramId: c.user.telegramId.toString(),
      },
      lastMessage: c.messages[0] ? serializeMessage(c.messages[0]) : null,
    })),
  });
}));

// GET /api/admin/support/conversations/:id — bitta suhbatning to'liq tarixi
adminSupport.get("/conversations/:id", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, telegramId: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conv) return res.status(404).json({ error: "Suhbat topilmadi" });

  // Admin ochganda, foydalanuvchi yuborgan xabarlar o'qilgan deb belgilanadi
  await prisma.supportMessage.updateMany({
    where: { conversationId: id, sender: "USER", isRead: false },
    data: { isRead: true },
  });
  await prisma.conversation.update({ where: { id }, data: { unreadForAdmin: 0 } });

  res.json({
    id: conv.id,
    status: conv.status,
    user: { ...conv.user, telegramId: conv.user.telegramId.toString() },
    messages: conv.messages.map(serializeMessage),
  });
}));

// POST /api/admin/support/conversations/:id/reply  { text }
adminSupport.post("/conversations/:id/reply", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Javob matni bo'sh bo'lmasligi kerak" });
  }

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return res.status(404).json({ error: "Suhbat topilmadi" });

  const message = await prisma.supportMessage.create({
    data: { conversationId: id, sender: "ADMIN", text: text.trim() },
  });
  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date(), unreadForUser: { increment: 1 } },
  });

  await logActivity(conv.userId, "SUPPORT_MESSAGE", "Admin javob berdi");
  await logAdminAction(req.user.id, "SUPPORT_REPLIED", { targetUserId: conv.userId });

  res.status(201).json({ message: serializeMessage(message) });
}));

// POST /api/admin/support/conversations/:id/reply-image (multipart, field: "image")
adminSupport.post("/conversations/:id/reply-image", requireIdParam, uploadImage.single("image"), asyncHandler(async (req, res) => {
  const id = req.id;
  if (!req.file) return res.status(400).json({ error: "Rasm fayli topilmadi" });

  const conv = await prisma.conversation.findUnique({ where: { id } });
  if (!conv) return res.status(404).json({ error: "Suhbat topilmadi" });

  const message = await prisma.supportMessage.create({
    data: { conversationId: id, sender: "ADMIN", imageUrl: publicUrlFor(req.file.filename) },
  });
  await prisma.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date(), unreadForUser: { increment: 1 } },
  });

  res.status(201).json({ message: serializeMessage(message) });
}));

// PATCH /api/admin/support/conversations/:id/status  { status: "OPEN" | "CLOSED" }
adminSupport.patch("/conversations/:id/status", requireIdParam, asyncHandler(async (req, res) => {
  const id = req.id;
  const { status } = req.body;
  if (status !== "OPEN" && status !== "CLOSED") {
    return res.status(400).json({ error: "status OPEN yoki CLOSED bo'lishi kerak" });
  }

  const conv = await prisma.conversation.update({ where: { id }, data: { status } });
  await logAdminAction(req.user.id, status === "CLOSED" ? "SUPPORT_CLOSED" : "SUPPORT_REOPENED", {
    targetUserId: conv.userId,
  });

  res.json({ status: conv.status });
}));

export { adminSupport };
