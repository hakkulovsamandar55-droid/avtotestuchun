-- SAQLANGAN SAVOLLAR VA XATOLAR BILAN ISHLASH
--
-- NIMA UCHUN UCHTA ALOHIDA JADVAL:
--
-- 1) saved_questions — foydalanuvchi qo'lda saqlagan savollar.
--    Sodda ko'p-ko'pga bog'lanish.
--
-- 2) question_mistakes — FAQAT XATO javoblar saqlanadi, hammasi emas.
--    Har bir javobni saqlash 10 000 foydalanuvchi x 500 savol = 5 mln qator
--    berardi. Xatolar esa ancha kam va "mening xatolarim" bo'limiga aynan
--    shu kerak. To'g'ri javob berilganda yozuv `resolved_at` bilan
--    belgilanadi (o'chirilmaydi — tarix foydali: "avval xato qilgan, endi
--    biladi").
--
-- 3) question_stats — GLOBAL agregat, foydalanuvchidan mustaqil.
--    "Odamlar ko'p xato qilayotgan savollar" uchun. Faqat 1220 qator
--    (savollar soni), shuning uchun juda arzon.
--    question_id PRIMARY KEY — alohida id ustuni shart emas.

CREATE TABLE "saved_questions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_mistakes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" TEXT NOT NULL,
    "wrong_count" INTEGER NOT NULL DEFAULT 1,
    "last_wrong_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "question_mistakes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "question_stats" (
    "question_id" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_stats_pkey" PRIMARY KEY ("question_id")
);

-- Bitta foydalanuvchi bitta savolni faqat bir marta saqlaydi.
-- Bu "save" tugmasini ikki marta bosishda dublikat yaratilishini to'sadi.
CREATE UNIQUE INDEX "saved_questions_user_id_question_id_key"
    ON "saved_questions"("user_id", "question_id");
CREATE INDEX "saved_questions_user_id_created_at_idx"
    ON "saved_questions"("user_id", "created_at");

-- Bitta foydalanuvchi + savol uchun bitta yozuv; xato takrorlansa
-- wrong_count oshadi.
CREATE UNIQUE INDEX "question_mistakes_user_id_question_id_key"
    ON "question_mistakes"("user_id", "question_id");
-- "Mening hal qilinmagan xatolarim" so'rovi uchun
CREATE INDEX "question_mistakes_user_id_resolved_at_idx"
    ON "question_mistakes"("user_id", "resolved_at");

-- Eng ko'p xato qilinadigan savollarni tartiblash uchun
CREATE INDEX "question_stats_wrong_count_idx" ON "question_stats"("wrong_count");

ALTER TABLE "saved_questions" ADD CONSTRAINT "saved_questions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "question_mistakes" ADD CONSTRAINT "question_mistakes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
