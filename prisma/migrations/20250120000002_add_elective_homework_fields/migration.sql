-- Add elective fields to Homework table
ALTER TABLE "Homework" ADD COLUMN "electiveGroupId" INTEGER;
ALTER TABLE "Homework" ADD COLUMN "electiveSubjectId" INTEGER;

-- Add foreign key constraints
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_electiveGroupId_fkey" FOREIGN KEY ("electiveGroupId") REFERENCES "ElectiveGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_electiveSubjectId_fkey" FOREIGN KEY ("electiveSubjectId") REFERENCES "ElectiveSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better performance
CREATE INDEX "Homework_electiveGroupId_idx" ON "Homework"("electiveGroupId");
CREATE INDEX "Homework_electiveSubjectId_idx" ON "Homework"("electiveSubjectId");
