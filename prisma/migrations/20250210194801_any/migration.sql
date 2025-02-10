/*
  Warnings:

  - You are about to drop the column `pdfPath` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "pdfPath",
ADD COLUMN     "pdfContent" BYTEA,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "tar" DROP NOT NULL,
ALTER COLUMN "nicotine" DROP NOT NULL,
ALTER COLUMN "co" DROP NOT NULL,
ALTER COLUMN "flavor" DROP NOT NULL,
ALTER COLUMN "fsp" DROP NOT NULL,
ALTER COLUMN "corners" DROP NOT NULL,
ALTER COLUMN "capsules" DROP NOT NULL;
