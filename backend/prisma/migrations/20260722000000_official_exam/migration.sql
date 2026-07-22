-- Rasmiy imtihon (Official Exam) moduli uchun migratsiya.
--
-- Barcha o'zgarishlar ADDITIVE (faqat qo'shish):
--   - 2 ta yangi enum
--   - 2 ta yangi jadval
--   - users jadvaliga 1 ta ustun (default qiymat bilan)
--
-- Mavjud ma'lumot o'zgartirilmaydi va o'chirilmaydi, shuning uchun bu
-- migratsiyani production'da xavfsiz qo'llash mumkin.

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExamEventType" AS ENUM ('CREATED', 'RESUMED', 'FOCUS_LOST', 'SUBMITTED', 'EXPIRED', 'ABANDONED');

-- AlterTable: mavjud foydalanuvchilar standart bo'yicha reytingda ko'rinadi
ALTER TABLE "users" ADD COLUMN "show_on_leaderboard" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "exam_version" INTEGER NOT NULL DEFAULT 1,
    "question_seed" INTEGER NOT NULL,
    "question_ids" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "duration_sec" INTEGER,
    "correct_count" INTEGER,
    "wrong_count" INTEGER,
    "accuracy_pct" INTEGER,
    "passed" BOOLEAN,
    "focus_lost_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_events" (
    "id" SERIAL NOT NULL,
    "exam_attempt_id" INTEGER NOT NULL,
    "type" "ExamEventType" NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_attempts_user_id_status_idx" ON "exam_attempts"("user_id", "status");

-- CreateIndex
CREATE INDEX "exam_attempts_user_id_started_at_idx" ON "exam_attempts"("user_id", "started_at");

-- CreateIndex: leaderboard (yakunlangan + o'tgan imtihonlarni ball bo'yicha tartiblash)
CREATE INDEX "exam_attempts_status_passed_correct_count_idx" ON "exam_attempts"("status", "passed", "correct_count");

-- CreateIndex: oylik/haftalik leaderboard uchun sana bo'yicha filtrlash
CREATE INDEX "exam_attempts_status_finished_at_idx" ON "exam_attempts"("status", "finished_at");

-- CreateIndex
CREATE INDEX "exam_events_exam_attempt_id_created_at_idx" ON "exam_events"("exam_attempt_id", "created_at");

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: imtihon o'chirilsa, uning hodisalari ham o'chadi
ALTER TABLE "exam_events" ADD CONSTRAINT "exam_events_exam_attempt_id_fkey" FOREIGN KEY ("exam_attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
