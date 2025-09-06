-- DropForeignKey
ALTER TABLE "public"."TeacherAssignment" DROP CONSTRAINT "TeacherAssignment_subjectId_fkey";

-- AlterTable
ALTER TABLE "public"."TeacherAssignment" ALTER COLUMN "subjectId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TeacherAssignment_classId_academicYearId_role_idx" ON "public"."TeacherAssignment"("classId", "academicYearId", "role");

-- AddForeignKey
ALTER TABLE "public"."TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
