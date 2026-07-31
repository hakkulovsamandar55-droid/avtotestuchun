-- MINI-ADMIN (MODERATOR) ROLI
--
-- Yangi rol: MODERATOR — faqat to'lov cheklarini tasdiqlash/rad etish va
-- statistika/foydalanuvchilar ro'yxatini (asosiy ma'lumot) ko'rish huquqiga
-- ega. Mavjud USER/ADMIN foydalanuvchilarga hech qanday ta'sir qilmaydi —
-- faqat enum'ga yangi qiymat qo'shiladi.

ALTER TYPE "Role" ADD VALUE 'MODERATOR';
ALTER TYPE "ActivityType" ADD VALUE 'MADE_MODERATOR';
