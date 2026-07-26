-- MAQSADLI (targeted) UY VAZIFASI
--
-- MUAMMO: vazifa faqat BUTUN GURUHGA berilardi. O'qituvchi talaba profilida
-- "zaif talabalar" ro'yxatini ko'radi, lekin aynan o'sha talabaga alohida
-- vazifa bera olmaydi. Bu mantiqsiz: statistika zaiflikni ko'rsatadi, lekin
-- unga javob berish vositasi yo'q.
--
-- YECHIM: submission'lar allaqachon har talaba uchun alohida yozuv, shuning
-- uchun kamroq submission yaratish kifoya. Lekin BITTA farqni saqlash kerak:
-- guruhga yangi talaba qo'shilganda u OCHIQ guruh vazifalariga avtomatik
-- yoziladi. Maqsadli vazifaga esa yozilmasligi kerak — u boshqa odam uchun
-- yaratilgan. Shu sababli `is_targeted` ustuni qo'shiladi.
--
-- ADDITIVE: mavjud yozuvlar false qiymat oladi, ya'ni avvalgidek guruh
-- vazifasi bo'lib qoladi.

ALTER TABLE "school_homeworks"
  ADD COLUMN "is_targeted" BOOLEAN NOT NULL DEFAULT false;
