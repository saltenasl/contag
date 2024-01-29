-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "orderedBy" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Item" SET "orderedBy"="createdAt";