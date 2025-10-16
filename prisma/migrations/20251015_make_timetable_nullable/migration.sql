-- Make timetableId fully optional/neutralized on Attendance and Grade
-- Drop FK constraints if present, allow NULLs, and clear existing values

-- Attendance: drop FK (if exists), allow NULL, set all to NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Attendance_timetableId_fkey'
  ) THEN
    ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_timetableId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- table may not exist in some environments
  NULL;
END $$;

-- Allow NULLs on Attendance.timetableId (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Attendance' AND column_name = 'timetableId'
  ) THEN
    ALTER TABLE "Attendance" ALTER COLUMN "timetableId" DROP NOT NULL;
    UPDATE "Attendance" SET "timetableId" = NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Grade: drop FK (if exists), allow NULL, set all to NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Grade_timetableId_fkey'
  ) THEN
    ALTER TABLE "Grade" DROP CONSTRAINT "Grade_timetableId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Grade' AND column_name = 'timetableId'
  ) THEN
    ALTER TABLE "Grade" ALTER COLUMN "timetableId" DROP NOT NULL;
    UPDATE "Grade" SET "timetableId" = NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;


