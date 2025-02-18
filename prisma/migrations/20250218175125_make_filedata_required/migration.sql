/*
  Warnings:

  - Made the column `fileData` on table `Promotion` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Promotion" ALTER COLUMN "fileData" SET NOT NULL;
