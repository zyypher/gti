/*
  Warnings:

  - You are about to drop the column `corners` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `Product` table. All the data in the column will be lost.
  - The `tar` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `nicotine` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `co` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fsp` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `capsules` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "corners",
DROP COLUMN "image",
DROP COLUMN "pdfUrl",
ADD COLUMN     "color" TEXT,
ADD COLUMN     "packetStyle" TEXT,
DROP COLUMN "tar",
ADD COLUMN     "tar" DOUBLE PRECISION,
DROP COLUMN "nicotine",
ADD COLUMN     "nicotine" DOUBLE PRECISION,
DROP COLUMN "co",
ADD COLUMN     "co" DOUBLE PRECISION,
DROP COLUMN "fsp",
ADD COLUMN     "fsp" BOOLEAN,
DROP COLUMN "capsules",
ADD COLUMN     "capsules" INTEGER;
