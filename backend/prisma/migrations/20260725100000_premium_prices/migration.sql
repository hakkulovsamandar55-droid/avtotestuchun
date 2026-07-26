-- PREMIUM NARXLARINI ADMIN PANELIDAN O'ZGARTIRISH
--
-- MUAMMO: narxlar kodda (shared/data/premiumPlans.js) qattiq yozilgan edi.
-- O'zgartirish uchun dasturchi kerak bo'lardi — admin panelda ogohlantirish
-- ham turardi: "Narxni o'zgartirish uchun dasturchiga murojaat qiling".
--
-- NIMA UCHUN FAQAT NARX VA TAVSIF DB'GA KO'CHIRILADI:
-- `key` va `durationDays` — biznes mantiqi (to'lov tekshiruvi, muddat
-- hisoblash shularga tayanadi). Ularni admin o'zgartirsa tizim buzilardi.
-- Shuning uchun jadvalda faqat ADMIN O'ZGARTIRISHI MUMKIN bo'lgan
-- maydonlar: narx, nom, badge, tavsif satrlari.
--
-- MUHIM: narx DB'da bo'lgach, to'lov chekini tekshirish (OCR) ham SHU
-- narxdan foydalanishi shart. Aks holda admin narxni oshiradi, foydalanuvchi
-- yangi narxni to'laydi, backend esa eski narx bo'yicha tekshirib "summa mos
-- emas" deb rad etadi.

CREATE TABLE "premium_plans" (
    -- key PRIMARY KEY: kod bilan bog'lanish nuqtasi, o'zgarmaydi
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "badge" TEXT NOT NULL DEFAULT '',
    "features" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_by_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premium_plans_pkey" PRIMARY KEY ("key")
);

-- Boshlang'ich qiymatlar — kodda turgan hozirgi narxlar.
-- Shu tariqa migratsiyadan keyin ilova AYNAN AVVALGIDEK ishlaydi.
INSERT INTO "premium_plans" ("key", "name", "price", "period", "badge", "features", "sort_order")
VALUES
  ('days15', '15 kunlik', 15000, '15 kun', '',
   'Barcha 61 ta bilet — cheklovsiz|Cheklovsiz rasmiy imtihon|AI xato tahlili va shaxsiy tavsiyalar|Statistika va progress grafiklari', 1),
  ('days30', '30 kunlik', 25000, '30 kun', 'Eng ommabop',
   'Barcha 61 ta bilet — cheklovsiz|Cheklovsiz rasmiy imtihon|AI xato tahlili va shaxsiy tavsiyalar|Statistika va progress grafiklari', 2),
  ('months3', '3 oylik', 60000, '3 oy', 'Eng foydali',
   'Barcha 61 ta bilet — cheklovsiz|Cheklovsiz rasmiy imtihon|AI xato tahlili va shaxsiy tavsiyalar|Statistika va progress grafiklari', 3);
