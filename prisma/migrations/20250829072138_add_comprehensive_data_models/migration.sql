/*
  Warnings:

  - You are about to drop the column `fileName` on the `HomeworkSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `HomeworkSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `HomeworkSubmission` table. All the data in the column will be lost.
  - Added the required column `academicYearId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branchId` to the `ExamResult` table without a default value. This is not possible if the table is not empty.
  - Made the column `branchId` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."AttachmentType" AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LINK', 'OTHER');

-- DropForeignKey
ALTER TABLE "public"."Teacher" DROP CONSTRAINT "Teacher_branchId_fkey";

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "academicYearId" INTEGER NOT NULL,
ADD COLUMN     "branchId" INTEGER NOT NULL,
ADD COLUMN     "classId" INTEGER NOT NULL,
ADD COLUMN     "subjectId" INTEGER NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ExamResult" ADD COLUMN     "branchId" INTEGER NOT NULL,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "teacherId" TEXT;

-- AlterTable
ALTER TABLE "public"."Homework" ADD COLUMN     "allowLateSubmission" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "latePenalty" DOUBLE PRECISION,
ADD COLUMN     "passingGrade" DOUBLE PRECISION,
ADD COLUMN     "totalPoints" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."HomeworkSubmission" DROP COLUMN "fileName",
DROP COLUMN "fileSize",
DROP COLUMN "fileUrl",
ADD COLUMN     "content" TEXT,
ADD COLUMN     "isLate" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Teacher" ALTER COLUMN "branchId" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."HomeworkAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" "public"."AttachmentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "mimeType" TEXT NOT NULL,
    "homeworkId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubmissionAttachment" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" "public"."AttachmentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION,
    "mimeType" TEXT NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeworkAttachment_homeworkId_fileType_idx" ON "public"."HomeworkAttachment"("homeworkId", "fileType");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_submissionId_fileType_idx" ON "public"."SubmissionAttachment"("submissionId", "fileType");

-- CreateIndex
CREATE INDEX "Attendance_teacherId_branchId_date_idx" ON "public"."Attendance"("teacherId", "branchId", "date");

-- CreateIndex
CREATE INDEX "Attendance_branchId_classId_date_idx" ON "public"."Attendance"("branchId", "classId", "date");

-- CreateIndex
CREATE INDEX "Attendance_branchId_academicYearId_date_idx" ON "public"."Attendance"("branchId", "academicYearId", "date");

-- CreateIndex
CREATE INDEX "ExamResult_teacherId_examId_idx" ON "public"."ExamResult"("teacherId", "examId");

-- CreateIndex
CREATE INDEX "ExamResult_branchId_studentId_idx" ON "public"."ExamResult"("branchId", "studentId");

-- CreateIndex
CREATE INDEX "Homework_branchId_teacherId_status_idx" ON "public"."Homework"("branchId", "teacherId", "status");

-- CreateIndex
CREATE INDEX "HomeworkSubmission_homeworkId_status_idx" ON "public"."HomeworkSubmission"("homeworkId", "status");

-- AddForeignKey
ALTER TABLE "public"."Teacher" ADD CONSTRAINT "Teacher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HomeworkAttachment" ADD CONSTRAINT "HomeworkAttachment_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "public"."Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."HomeworkSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
