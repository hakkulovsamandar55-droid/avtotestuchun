import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../authMiddleware.js";

export const adminRouter = Router();

// Bu bo'limdagi HAR BIR endpoint avval requireAuth (token borligini),
// keyin requireAdmin (rol ADMIN ekanligini) tekshiradi.
adminRouter.use(requireAuth, requireAdmin);

// GET /api/admin/users?query=ism-yoki-username-yoki-telefon
adminRouter.get("/users", async (req, res) => {
  const query = (req.query.query || "").trim();

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      examReadiness: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({ users, count: users.length });
});
