-- GURUH TAKLIF KODI + KO'P GURUHLI O'QITUVCHI
--
-- MAQSAD (onboarding'ni soddalashtirish):
--   Ilgari talabani guruhga qo'shish uchun Owner/CEO aralashuvi kerak edi
--   (Invitation yaratish, tasdiqlash va h.k.). Endi har bir guruhning
--   DOIMIY taklif kodi bor — talaba kodni kiritadi va o'zi qo'shiladi.
--
-- 1) school_groups.invite_code
--    Guruhning doimiy kodi, masalan "AB12-X7KF". UNIQUE, chunki kod
--    bo'yicha guruh topiladi.
--
--    MAVJUD GURUHLAR: NOT NULL qila olmaymiz — avval kod generatsiya
--    qilish kerak. Shuning uchun uch bosqich: nullable qo'shish ->
--    backfill -> NOT NULL. Backfill SQL ichida bajariladi, alohida
--    skript ishga tushirish shart emas (deploy oqimi soddaroq).
--
-- 2) school_group_teachers
--    O'qituvchi <-> guruh ko'pga-ko'p. Haqiqiy avto maktabda bitta
--    o'qituvchi ertalabki va kechki guruhga dars beradi —
--    memberships.group_id (bitta maydon) buni ifodalay olmaydi.
--
--    ESKI MA'LUMOT: mavjud TEACHER a'zoliklaridagi group_id shu jadvalga
--    ko'chiriladi. memberships.group_id O'CHIRILMAYDI — talaba uchun u
--    asosiy manba bo'lib qoladi va eski kod ishlashda davom etadi.

-- ---------------------------------------------------------------------------
-- 1) Guruh taklif kodi
-- ---------------------------------------------------------------------------

ALTER TABLE "school_groups" ADD COLUMN "invite_code" TEXT;

-- Mavjud guruhlarga kod generatsiya qilamid: 8 belgi, o'rtasida chiziqcha.
-- md5(random) dan olamiz va chalkashadigan belgilarni (0/O, 1/I) olib
-- tashlash uchun faqat raqam va A-F harflar chiqadi (hex) — bu yetarli
-- darajada aniq va o'qish oson.
UPDATE "school_groups"
SET "invite_code" = UPPER(
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 4)
  || '-' ||
  SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT || 'x') FROM 1 FOR 4)
)
WHERE "invite_code" IS NULL;

ALTER TABLE "school_groups" ALTER COLUMN "invite_code" SET NOT NULL;

CREATE UNIQUE INDEX "school_groups_invite_code_key" ON "school_groups"("invite_code");

-- ---------------------------------------------------------------------------
-- 2) O'qituvchi <-> guruh (ko'pga-ko'p)
-- ---------------------------------------------------------------------------

CREATE TABLE "school_group_teachers" (
  "id"            SERIAL       NOT NULL,
  "group_id"      INTEGER      NOT NULL,
  "membership_id" INTEGER      NOT NULL,
  "assigned_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "school_group_teachers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "school_group_teachers_group_id_membership_id_key"
  ON "school_group_teachers"("group_id", "membership_id");

CREATE INDEX "school_group_teachers_membership_id_idx"
  ON "school_group_teachers"("membership_id");

ALTER TABLE "school_group_teachers"
  ADD CONSTRAINT "school_group_teachers_group_id_fkey"
  FOREIGN KEY ("group_id") REFERENCES "school_groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_group_teachers"
  ADD CONSTRAINT "school_group_teachers_membership_id_fkey"
  FOREIGN KEY ("membership_id") REFERENCES "school_memberships"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Eski ma'lumotni ko'chirish: guruhga biriktirilgan har bir faol
-- o'qituvchi uchun bitta qator.
INSERT INTO "school_group_teachers" ("group_id", "membership_id")
SELECT "group_id", "id"
FROM "school_memberships"
WHERE "role" = 'TEACHER'
  AND "status" = 'ACTIVE'
  AND "group_id" IS NOT NULL
ON CONFLICT DO NOTHING;
