-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "fileData" BYTEA,
ALTER COLUMN "filePath" DROP NOT NULL;
