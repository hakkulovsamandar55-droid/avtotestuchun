import { PrismaClient } from "@prisma/client";

// Butun ilova bo'ylab bitta Prisma instance ishlatiladi
// (har chaqiruvda yangi client ochish connection pool'ni tugatib qo'yadi).
export const prisma = new PrismaClient();
