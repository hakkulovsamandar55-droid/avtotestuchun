-- NotificationType enumiga SCHOOL_MESSAGE qiymatini qo'shish.
--
-- NIMA UCHUN ALOHIDA MIGRATSIYA: PostgreSQL'da `ALTER TYPE ... ADD VALUE`
-- tranzaksiya blokida ishlamaydi ("cannot run inside a transaction block").
-- Prisma har bir migratsiya faylini bitta tranzaksiyada bajaradi, shuning
-- uchun enum o'zgarishi jadval yaratishdan AJRATILGAN bo'lishi shart.
-- Aks holda `prisma migrate deploy` xato bilan to'xtardi.

ALTER TYPE "NotificationType" ADD VALUE 'SCHOOL_MESSAGE';
