-- CreateEnum
CREATE TYPE "public"."MealPlanStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'AUTO_APPROVED');

-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('LUNCH', 'SNACK');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ApproverType" AS ENUM ('DOCTOR', 'SUPPORT_DIRECTOR');

-- CreateTable
CREATE TABLE "public"."MealPlan" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "weekEndDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."MealPlanStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "branchId" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "autoApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Meal" (
    "id" SERIAL NOT NULL,
    "day" "public"."Day" NOT NULL,
    "mealType" "public"."MealType" NOT NULL,
    "recipeTitle" TEXT NOT NULL,
    "description" TEXT,
    "ingredients" TEXT[],
    "allergens" TEXT[],
    "calories" INTEGER,
    "preparationTime" INTEGER,
    "servingSize" TEXT,
    "mealPlanId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MealApproval" (
    "id" SERIAL NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL,
    "comment" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealPlanId" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverType" "public"."ApproverType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MealPlan_branchId_status_createdAt_idx" ON "public"."MealPlan"("branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MealPlan_createdById_status_idx" ON "public"."MealPlan"("createdById", "status");

-- CreateIndex
CREATE INDEX "Meal_mealPlanId_day_mealType_idx" ON "public"."Meal"("mealPlanId", "day", "mealType");

-- CreateIndex
CREATE INDEX "MealApproval_approverId_status_idx" ON "public"."MealApproval"("approverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MealApproval_mealPlanId_approverType_key" ON "public"."MealApproval"("mealPlanId", "approverType");

-- AddForeignKey
ALTER TABLE "public"."MealPlan" ADD CONSTRAINT "MealPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealPlan" ADD CONSTRAINT "MealPlan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Meal" ADD CONSTRAINT "Meal_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "public"."MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealApproval" ADD CONSTRAINT "MealApproval_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "public"."MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MealApproval" ADD CONSTRAINT "MealApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
