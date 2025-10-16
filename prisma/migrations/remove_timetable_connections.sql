-- Remove timetable connections from Attendance and Grade models
-- This migration removes the timetableId foreign key constraints and fields

-- First, drop the foreign key constraints
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_timetableId_fkey";
ALTER TABLE "Grade" DROP CONSTRAINT IF EXISTS "Grade_timetableId_fkey";

-- Then drop the timetableId columns
ALTER TABLE "Attendance" DROP COLUMN IF EXISTS "timetableId";
ALTER TABLE "Grade" DROP COLUMN IF EXISTS "timetableId";

-- Also remove timetableId from ArchiveComment if it exists
ALTER TABLE "ArchiveComment" DROP COLUMN IF EXISTS "timetableId";
