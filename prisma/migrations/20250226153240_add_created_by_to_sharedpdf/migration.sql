/*
  Warnings:

  - Added the required column `createdById` to the `SharedPDF` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SharedPDF" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SharedPDF" ADD CONSTRAINT "SharedPDF_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
