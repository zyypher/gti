/*
  Warnings:

  - You are about to drop the column `pdfContent` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "pdfContent";

-- CreateTable
CREATE TABLE "ProductPDF" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "pdfContent" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPDF_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPDF_productId_key" ON "ProductPDF"("productId");

-- AddForeignKey
ALTER TABLE "ProductPDF" ADD CONSTRAINT "ProductPDF_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
