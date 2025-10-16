-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "lessonNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Grade" ADD COLUMN "lessonNumber" INTEGER NOT NULL DEFAULT 1;

-- Drop old unique constraint on Attendance
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_studentId_classId_subjectId_date_key";

-- Add new unique constraint including lessonNumber on Attendance
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_classId_subjectId_date_lessonNumber_key" UNIQUE ("studentId", "classId", "subjectId", "date", "lessonNumber");
