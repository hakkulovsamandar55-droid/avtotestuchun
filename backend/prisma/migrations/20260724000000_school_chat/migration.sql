-- Maktab chati: o'qituvchi ↔ talaba yozishuvi.
--
-- NIMA UCHUN ALOHIDA JADVALLAR (mavjud conversations/support_messages emas):
-- support chat 1:1 (foydalanuvchi ↔ admin) uchun qurilgan — conversations.user_id
-- UNIQUE va sender faqat USER/ADMIN. Maktabda esa ko'p-ko'pga munosabat:
-- bir talaba turli o'qituvchilar bilan, bir o'qituvchi ko'p talaba bilan
-- yozishadi. Mavjud modelni cho'zish uning mantiqini buzardi.
--
-- Ishtirokchilar membership_id orqali bog'lanadi (user_id emas) — odam
-- maktabdan chiqsa a'zoligi ARCHIVED bo'ladi, chat tarixi esa o'sha maktabga
-- tegishli bo'lib qoladi.
--
-- ADDITIVE migratsiya: faqat yangi jadval va enum qiymati qo'shiladi,
-- mavjud ma'lumotlarga tegilmaydi.

-- ESLATMA: NotificationType enumiga SCHOOL_MESSAGE qiymati OLDINGI
-- migratsiyada qo'shilgan (20260723500000_school_message_notif) — PostgreSQL
-- `ALTER TYPE ... ADD VALUE` ni tranzaksiya ichida bajarishga ruxsat bermaydi.

-- Chatlar
CREATE TABLE "school_chats" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_membership_id" INTEGER NOT NULL,
    "teacher_membership_id" INTEGER NOT NULL,
    "unread_for_student" INTEGER NOT NULL DEFAULT 0,
    "unread_for_teacher" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "last_message_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_chats_pkey" PRIMARY KEY ("id")
);

-- Xabarlar
CREATE TABLE "school_messages" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_membership_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_messages_pkey" PRIMARY KEY ("id")
);

-- Bir juftlik uchun faqat BITTA chat. Bu poyga holatida (ikki so'rov bir
-- vaqtda kelsa) ikkinchi chat yaratilishini DB darajasida to'sadi.
CREATE UNIQUE INDEX "school_chats_student_membership_id_teacher_membership_id_key"
    ON "school_chats"("student_membership_id", "teacher_membership_id");

-- Ro'yxat so'rovlari: "mening chatlarim, oxirgi xabar bo'yicha tartiblangan"
CREATE INDEX "school_chats_school_id_last_message_at_idx"
    ON "school_chats"("school_id", "last_message_at");
CREATE INDEX "school_chats_teacher_membership_id_last_message_at_idx"
    ON "school_chats"("teacher_membership_id", "last_message_at");
CREATE INDEX "school_chats_student_membership_id_last_message_at_idx"
    ON "school_chats"("student_membership_id", "last_message_at");

-- Xabarlarni sahifalab olish uchun
CREATE INDEX "school_messages_chat_id_created_at_idx"
    ON "school_messages"("chat_id", "created_at");

-- Tashqi kalitlar.
-- ON DELETE CASCADE: maktab yoki a'zolik o'chirilsa, chat ham o'chadi —
-- yetim yozuvlar qolmasligi uchun.
ALTER TABLE "school_chats" ADD CONSTRAINT "school_chats_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_chats" ADD CONSTRAINT "school_chats_student_membership_id_fkey"
    FOREIGN KEY ("student_membership_id") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_chats" ADD CONSTRAINT "school_chats_teacher_membership_id_fkey"
    FOREIGN KEY ("teacher_membership_id") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_messages" ADD CONSTRAINT "school_messages_chat_id_fkey"
    FOREIGN KEY ("chat_id") REFERENCES "school_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "school_messages" ADD CONSTRAINT "school_messages_sender_membership_id_fkey"
    FOREIGN KEY ("sender_membership_id") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
