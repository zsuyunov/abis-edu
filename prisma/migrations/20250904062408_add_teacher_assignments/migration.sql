/*
  Warnings:

  - You are about to drop the column `supervisorId` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the `_SubjectToTeacher` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `branchId` to the `Parent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ParentRelationship" AS ENUM ('Father', 'Mother', 'Guardian', 'Other');

-- CreateEnum
CREATE TYPE "public"."TeacherAssignmentRole" AS ENUM ('TEACHER', 'SUPERVISOR');

-- DropForeignKey
ALTER TABLE "public"."Class" DROP CONSTRAINT "Class_supervisorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_parentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Teacher" DROP CONSTRAINT "Teacher_branchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_SubjectToTeacher" DROP CONSTRAINT "_SubjectToTeacher_B_fkey";

-- DropIndex
DROP INDEX "public"."Attendance_teacherId_branchId_date_idx";

-- DropIndex
DROP INDEX "public"."Homework_branchId_teacherId_status_idx";

-- AlterTable
ALTER TABLE "public"."Class" DROP COLUMN "supervisorId";

-- AlterTable
ALTER TABLE "public"."Parent" ADD COLUMN     "branchId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."Student" DROP COLUMN "parentId";

-- AlterTable
ALTER TABLE "public"."Teacher" DROP COLUMN "branchId";

-- DropTable
DROP TABLE "public"."_SubjectToTeacher";

-- CreateTable
CREATE TABLE "public"."StudentParent" (
    "id" SERIAL NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationship" "public"."ParentRelationship" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherAssignment" (
    "id" SERIAL NOT NULL,
    "teacherId" TEXT NOT NULL,
    "branchId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "role" "public"."TeacherAssignmentRole" NOT NULL DEFAULT 'TEACHER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentParent_parentId_idx" ON "public"."StudentParent"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentParent_studentId_parentId_relationship_key" ON "public"."StudentParent"("studentId", "parentId", "relationship");

-- CreateIndex
CREATE INDEX "TeacherAssignment_teacherId_status_idx" ON "public"."TeacherAssignment"("teacherId", "status");

-- CreateIndex
CREATE INDEX "TeacherAssignment_branchId_status_idx" ON "public"."TeacherAssignment"("branchId", "status");

-- CreateIndex
CREATE INDEX "TeacherAssignment_classId_academicYearId_idx" ON "public"."TeacherAssignment"("classId", "academicYearId");

-- CreateIndex
CREATE INDEX "TeacherAssignment_subjectId_academicYearId_idx" ON "public"."TeacherAssignment"("subjectId", "academicYearId");

-- CreateIndex
CREATE INDEX "TeacherAssignment_role_status_idx" ON "public"."TeacherAssignment"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherAssignment_teacherId_branchId_classId_subjectId_acad_key" ON "public"."TeacherAssignment"("teacherId", "branchId", "classId", "subjectId", "academicYearId");

-- CreateIndex
CREATE INDEX "Attendance_teacherId_date_idx" ON "public"."Attendance"("teacherId", "date");

-- CreateIndex
CREATE INDEX "Class_branchId_status_idx" ON "public"."Class"("branchId", "status");

-- CreateIndex
CREATE INDEX "Class_academicYearId_status_idx" ON "public"."Class"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "Class_branchId_academicYearId_idx" ON "public"."Class"("branchId", "academicYearId");

-- CreateIndex
CREATE INDEX "Class_status_createdAt_idx" ON "public"."Class"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Homework_teacherId_status_idx" ON "public"."Homework"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Parent_branchId_status_idx" ON "public"."Parent"("branchId", "status");

-- CreateIndex
CREATE INDEX "Parent_firstName_lastName_idx" ON "public"."Parent"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Parent_status_createdAt_idx" ON "public"."Parent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Student_branchId_status_idx" ON "public"."Student"("branchId", "status");

-- CreateIndex
CREATE INDEX "Student_classId_status_idx" ON "public"."Student"("classId", "status");

-- CreateIndex
CREATE INDEX "Student_branchId_classId_idx" ON "public"."Student"("branchId", "classId");

-- CreateIndex
CREATE INDEX "Student_firstName_lastName_idx" ON "public"."Student"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Student_createdAt_idx" ON "public"."Student"("createdAt");

-- CreateIndex
CREATE INDEX "Teacher_firstName_lastName_idx" ON "public"."Teacher"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Teacher_status_createdAt_idx" ON "public"."Teacher"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Timetable_branchId_academicYearId_classId_subjectId_idx" ON "public"."Timetable"("branchId", "academicYearId", "classId", "subjectId");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_fullDate_idx" ON "public"."Timetable"("teacherId", "fullDate");

-- CreateIndex
CREATE INDEX "Timetable_classId_day_startTime_idx" ON "public"."Timetable"("classId", "day", "startTime");

-- CreateIndex
CREATE INDEX "Timetable_teacherId_status_idx" ON "public"."Timetable"("teacherId", "status");

-- CreateIndex
CREATE INDEX "Timetable_fullDate_startTime_endTime_idx" ON "public"."Timetable"("fullDate", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Timetable_status_createdAt_idx" ON "public"."Timetable"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Parent" ADD CONSTRAINT "Parent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentParent" ADD CONSTRAINT "StudentParent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentParent" ADD CONSTRAINT "StudentParent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
