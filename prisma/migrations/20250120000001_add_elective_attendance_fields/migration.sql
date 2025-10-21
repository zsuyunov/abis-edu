-- Add elective fields to Attendance table
ALTER TABLE "Attendance" ADD COLUMN "electiveGroupId" INTEGER;
ALTER TABLE "Attendance" ADD COLUMN "electiveSubjectId" INTEGER;

-- Add foreign key constraints
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_electiveGroupId_fkey" FOREIGN KEY ("electiveGroupId") REFERENCES "ElectiveGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_electiveSubjectId_fkey" FOREIGN KEY ("electiveSubjectId") REFERENCES "ElectiveSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better performance
CREATE INDEX "Attendance_electiveGroupId_idx" ON "Attendance"("electiveGroupId");
CREATE INDEX "Attendance_electiveSubjectId_idx" ON "Attendance"("electiveSubjectId");
