-- CreateTable
CREATE TABLE "SharedPDF" (
    "id" TEXT NOT NULL,
    "uniqueSlug" TEXT NOT NULL,
    "productIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedPDF_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedPDF_uniqueSlug_key" ON "SharedPDF"("uniqueSlug");
