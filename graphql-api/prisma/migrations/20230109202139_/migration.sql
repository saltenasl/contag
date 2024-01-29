-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "addressedToItemId" INTEGER;

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_addressedToItemId_fkey" FOREIGN KEY ("addressedToItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
