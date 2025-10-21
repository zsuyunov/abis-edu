-- CreateEnum
CREATE TYPE "ElectiveGroupStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ElectiveSubjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'FULL');

-- CreateEnum
CREATE TYPE "ElectiveAssignmentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'COMPLETED');

-- CreateTable
CREATE TABLE "ElectiveGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "branchId" INTEGER NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "status" "ElectiveGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveSubject" (
    "id" SERIAL NOT NULL,
    "electiveGroupId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "teacherIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxStudents" INTEGER,
    "description" TEXT,
    "status" "ElectiveSubjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectiveSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectiveStudentAssignment" (
    "id" SERIAL NOT NULL,
    "electiveSubjectId" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "status" "ElectiveAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "ElectiveStudentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElectiveGroup_branchId_academicYearId_status_idx" ON "ElectiveGroup"("branchId", "academicYearId", "status");

-- CreateIndex
CREATE INDEX "ElectiveGroup_status_createdAt_idx" ON "ElectiveGroup"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveGroup_name_branchId_academicYearId_key" ON "ElectiveGroup"("name", "branchId", "academicYearId");

-- CreateIndex
CREATE INDEX "ElectiveSubject_electiveGroupId_status_idx" ON "ElectiveSubject"("electiveGroupId", "status");

-- CreateIndex
CREATE INDEX "ElectiveSubject_subjectId_idx" ON "ElectiveSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveSubject_electiveGroupId_subjectId_key" ON "ElectiveSubject"("electiveGroupId", "subjectId");

-- CreateIndex
CREATE INDEX "ElectiveStudentAssignment_studentId_status_idx" ON "ElectiveStudentAssignment"("studentId", "status");

-- CreateIndex
CREATE INDEX "ElectiveStudentAssignment_electiveSubjectId_status_idx" ON "ElectiveStudentAssignment"("electiveSubjectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ElectiveStudentAssignment_electiveSubjectId_studentId_key" ON "ElectiveStudentAssignment"("electiveSubjectId", "studentId");

-- AddForeignKey
ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ElectiveGroup_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveGroup" ADD CONSTRAINT "ElectiveGroup_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveSubject" ADD CONSTRAINT "ElectiveSubject_electiveGroupId_fkey" FOREIGN KEY ("electiveGroupId") REFERENCES "ElectiveGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveSubject" ADD CONSTRAINT "ElectiveSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveStudentAssignment" ADD CONSTRAINT "ElectiveStudentAssignment_electiveSubjectId_fkey" FOREIGN KEY ("electiveSubjectId") REFERENCES "ElectiveSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectiveStudentAssignment" ADD CONSTRAINT "ElectiveStudentAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

