/*
  Warnings:

  - You are about to drop the `Advertisement` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Advertisement";

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);
