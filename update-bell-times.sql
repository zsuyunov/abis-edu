
-- Update bell times for 7-13 with new times
UPDATE "BellTime" SET 
  "startTime" = '07:30:00', 
  "endTime" = '07:55:00',
  "notes" = 'Morning meal time'
WHERE "yearRange" = '7-13' AND "eventName" = 'Breakfast';

UPDATE "BellTime" SET 
  "startTime" = '09:40:00', 
  "endTime" = '09:55:00',
  "notes" = 'Morning snack break'
WHERE "yearRange" = '7-13' AND "eventName" = 'Snack Time';

-- Add Rest Time if it doesn't exist
INSERT INTO "BellTime" ("yearRange", "eventName", "startTime", "endTime", "notes")
SELECT '7-13', 'Rest Time', '11:40:00', '12:00:00', 'Mid-day rest period'
WHERE NOT EXISTS (
  SELECT 1 FROM "BellTime" 
  WHERE "yearRange" = '7-13' AND "eventName" = 'Rest Time'
);

UPDATE "BellTime" SET 
  "startTime" = '12:05:00', 
  "endTime" = '12:50:00',
  "notes" = 'Lunch break'
WHERE "yearRange" = '7-13' AND "eventName" = 'Lunch break';
