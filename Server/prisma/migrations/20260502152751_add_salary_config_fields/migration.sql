-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "breakTimeHours" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "empCode" TEXT,
ADD COLUMN     "workingDaysPerWeek" INTEGER NOT NULL DEFAULT 5;
