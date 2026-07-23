-- ActivityType enumiga maktab (School) hodisalari uchun qiymatlar qo'shish.
--
-- SABAB: schoolService.js (createSchool, joinSchoolByCode, setSchoolStatus,
-- deleteSchool) logActivity() ni "SCHOOL_CREATED", "SCHOOL_JOINED",
-- "SCHOOL_APPROVED", "SCHOOL_DISABLED", "SCHOOL_DELETED" qiymatlari bilan
-- chaqiradi, lekin bu qiymatlar ActivityType enum'ida yo'q edi. Natijada:
-- maktab MUVAFFAQIYATLI yaratilardi (School + Membership tranzaksiya ichida),
-- lekin tranzaksiyadan TASHQARIDAGI logActivity() chaqiruvi xato berib,
-- foydalanuvchiga yolg'on "Server xatosi" ko'rsatilardi.
--
-- ADDITIVE (faqat qo'shish) migratsiya — mavjud qiymatlar yoki ma'lumotlar
-- o'zgartirilmaydi, shuning uchun production'da xavfsiz.
--
-- IF NOT EXISTS ishlatilgan (PostgreSQL 12+): agar qiymat allaqachon
-- qo'shilgan bo'lsa, migratsiya xato bermay o'tib ketadi. Bu migratsiyani
-- qayta ishga tushirishni ham xavfsiz qiladi.

ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SCHOOL_CREATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SCHOOL_JOINED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SCHOOL_APPROVED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SCHOOL_DISABLED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'SCHOOL_DELETED';
