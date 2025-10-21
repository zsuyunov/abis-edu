-- CreateEnum
CREATE TYPE "ElectiveClassStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'INACTIVE');

-- CreateTable
CREATE TABLE "ElectiveClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "branchId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "status" "ElectiveClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ElectiveClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveClassSubject" (
    "id" SERIAL NOT NULL,
    "electiveClassId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxStudents" INTEGER,
    "description" TEXT,
    "status" "ElectiveSubjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectiveClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveClassStudentAssignment" (
    "id" SERIAL NOT NULL,
    "electiveClassSubjectId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "status" "ElectiveAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ElectiveClassStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ElectiveClass" ADD CONSTRAINT "ElectiveClass_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectiveClass" ADD CONSTRAINT "ElectiveClass_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectiveClass" ADD CONSTRAINT "ElectiveClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectiveClassSubject" ADD CONSTRAINT "ElectiveClassSubject_electiveClassId_fkey" FOREIGN KEY ("electiveClassId") REFERENCES "ElectiveClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectiveClassSubject" ADD CONSTRAINT "ElectiveClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ElectiveClassStudentAssignment" ADD CONSTRAINT "ElectiveClassStudentAssignment_electiveClassSubjectId_fkey" FOREIGN KEY ("electiveClassSubjectId") REFERENCES "ElectiveClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ElectiveClassStudentAssignment" ADD CONSTRAINT "ElectiveClassStudentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "ElectiveClass_branchId_academicYearId_classId_status_idx" ON "ElectiveClass"("branchId", "academicYearId", "classId", "status");
CREATE INDEX "ElectiveClass_status_createdAt_idx" ON "ElectiveClass"("status", "createdAt");
CREATE UNIQUE INDEX "ElectiveClass_name_branchId_academicYearId_classId_key" ON "ElectiveClass"("name", "branchId", "academicYearId", "classId");

CREATE INDEX "ElectiveClassSubject_electiveClassId_status_idx" ON "ElectiveClassSubject"("electiveClassId", "status");
CREATE INDEX "ElectiveClassSubject_subjectId_idx" ON "ElectiveClassSubject"("subjectId");
CREATE UNIQUE INDEX "ElectiveClassSubject_electiveClassId_subjectId_key" ON "ElectiveClassSubject"("electiveClassId", "subjectId");

CREATE INDEX "ElectiveClassStudentAssignment_studentId_status_idx" ON "ElectiveClassStudentAssignment"("studentId", "status");
CREATE INDEX "ElectiveClassStudentAssignment_electiveClassSubjectId_status_idx" ON "ElectiveClassStudentAssignment"("electiveClassSubjectId", "status");
CREATE UNIQUE INDEX "ElectiveClassStudentAssignment_electiveClassSubjectId_studentId_key" ON "ElectiveClassStudentAssignment"("electiveClassSubjectId", "studentId");
