/*
  Warnings:

  - You are about to drop the `ProductPDF` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductPDF" DROP CONSTRAINT "ProductPDF_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "pdfUrl" TEXT;

-- DropTable
DROP TABLE "ProductPDF";
