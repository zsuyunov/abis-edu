-- Step 1: Add lessonNumber columns if they don't exist
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "lessonNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Grade" ADD COLUMN IF NOT EXISTS "lessonNumber" INTEGER NOT NULL DEFAULT 1;

-- Step 2: Drop the old unique constraint
ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS "Attendance_studentId_classId_subjectId_date_key";

-- Step 3: Handle duplicate attendance records by assigning different lesson numbers
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "studentId", "classId", "subjectId", date 
      ORDER BY "createdAt", id
    ) as lesson_num
  FROM "Attendance"
)
UPDATE "Attendance"
SET "lessonNumber" = duplicates.lesson_num
FROM duplicates
WHERE "Attendance".id = duplicates.id;

-- Step 4: Handle duplicate grade records by assigning different lesson numbers
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "studentId", "classId", "subjectId", date, type
      ORDER BY "createdAt", id
    ) as lesson_num
  FROM "Grade"
)
UPDATE "Grade"
SET "lessonNumber" = duplicates.lesson_num
FROM duplicates
WHERE "Grade".id = duplicates.id;

-- Step 5: Now add the unique constraint (should work now)
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_classId_subjectId_date_lessonNumber_key" 
  UNIQUE ("studentId", "classId", "subjectId", "date", "lessonNumber");
