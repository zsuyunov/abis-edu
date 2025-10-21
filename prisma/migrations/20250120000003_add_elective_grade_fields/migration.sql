-- Add elective fields to Grade table
ALTER TABLE "Grade" ADD COLUMN "electiveGroupId" INTEGER;
ALTER TABLE "Grade" ADD COLUMN "electiveSubjectId" INTEGER;

-- Add foreign key constraints
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_electiveGroupId_fkey" FOREIGN KEY ("electiveGroupId") REFERENCES "ElectiveGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_electiveSubjectId_fkey" FOREIGN KEY ("electiveSubjectId") REFERENCES "ElectiveSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes for better performance
CREATE INDEX "Grade_electiveGroupId_idx" ON "Grade"("electiveGroupId");
CREATE INDEX "Grade_electiveSubjectId_idx" ON "Grade"("electiveSubjectId");
