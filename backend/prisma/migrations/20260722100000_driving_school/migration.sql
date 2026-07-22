-- Haydovchilik maktablari ekotizimi.
--
-- Barcha o'zgarishlar ADDITIVE — yangi enumlar, yangi jadvallar, User'ga
-- yangi (nullable/default) bog'lanishlar. Mavjud ma'lumot o'zgarmaydi.

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SchoolMemberRole" AS ENUM ('OWNER', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('SCHOOL', 'GROUP');

-- CreateEnum
CREATE TYPE "HomeworkType" AS ENUM ('PRACTICE', 'OFFICIAL_EXAM', 'TICKETS', 'SIGNS');

-- CreateEnum
CREATE TYPE "HomeworkSubmissionStatus" AS ENUM ('PENDING', 'COMPLETED', 'LATE', 'MISSED');

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "brand_color" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "status" "SchoolStatus" NOT NULL DEFAULT 'PENDING',
    "owner_id" INTEGER,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "disabled_reason" TEXT,
    "disabled_at" TIMESTAMP(3),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_groups" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "role" "SchoolMemberRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_invitations" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "InvitationType" NOT NULL,
    "school_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "created_by_id" INTEGER NOT NULL,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_homeworks" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "HomeworkType" NOT NULL,
    "params" TEXT NOT NULL DEFAULT '{}',
    "min_score" INTEGER,
    "deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_homeworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_homework_submissions" (
    "id" SERIAL NOT NULL,
    "homework_id" INTEGER NOT NULL,
    "membership_id" INTEGER NOT NULL,
    "status" "HomeworkSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "attempt_id" INTEGER,
    "exam_attempt_id" INTEGER,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_homework_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_invitations_code_key" ON "school_invitations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "school_homework_submissions_homework_id_membership_id_key" ON "school_homework_submissions"("homework_id", "membership_id");

-- CreateIndex
CREATE INDEX "schools_status_idx" ON "schools"("status");
CREATE INDEX "school_groups_school_id_idx" ON "school_groups"("school_id");
CREATE INDEX "school_memberships_user_id_status_idx" ON "school_memberships"("user_id", "status");
CREATE INDEX "school_memberships_school_id_role_status_idx" ON "school_memberships"("school_id", "role", "status");
CREATE INDEX "school_memberships_group_id_status_idx" ON "school_memberships"("group_id", "status");
CREATE INDEX "school_invitations_school_id_idx" ON "school_invitations"("school_id");
CREATE INDEX "school_invitations_code_idx" ON "school_invitations"("code");
CREATE INDEX "school_homeworks_group_id_idx" ON "school_homeworks"("group_id");
CREATE INDEX "school_homeworks_school_id_deadline_idx" ON "school_homeworks"("school_id", "deadline");
CREATE INDEX "school_homework_submissions_membership_id_status_idx" ON "school_homework_submissions"("membership_id", "status");

-- QISMAN UNIQUE INDEKS: bitta foydalanuvchi bir vaqtning o'zida faqat BITTA
-- ACTIVE a'zolikka ega bo'lishi mumkin. Bu qoida service qatlamida
-- (schoolService.js) ham tekshiriladi, lekin DB darajasidagi himoya race
-- condition'lardan (ikkita so'rov bir vaqtda kelib, ikkita ACTIVE a'zolik
-- yaratib yuborishidan) himoya qiladi.
CREATE UNIQUE INDEX "school_memberships_one_active_per_user"
  ON "school_memberships"("user_id")
  WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "school_groups" ADD CONSTRAINT "school_groups_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "school_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "school_invitations" ADD CONSTRAINT "school_invitations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_invitations" ADD CONSTRAINT "school_invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "school_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "school_homeworks" ADD CONSTRAINT "school_homeworks_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_homeworks" ADD CONSTRAINT "school_homeworks_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "school_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_homework_submissions" ADD CONSTRAINT "school_homework_submissions_homework_id_fkey" FOREIGN KEY ("homework_id") REFERENCES "school_homeworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "school_homework_submissions" ADD CONSTRAINT "school_homework_submissions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "school_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
