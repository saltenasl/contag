/*
  Warnings:

  - You are about to drop the column `audienceId` on the `Recipient` table. All the data in the column will be lost.
  - You are about to drop the `Audience` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Audience" DROP CONSTRAINT "Audience_itemId_fkey";

-- DropForeignKey
ALTER TABLE "Recipient" DROP CONSTRAINT "Recipient_audienceId_fkey";

-- AlterTable
ALTER TABLE "Recipient" DROP COLUMN "audienceId",
ADD COLUMN     "sharedWithItemId" INTEGER;

-- DropTable
DROP TABLE "Audience";

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_sharedWithItemId_fkey" FOREIGN KEY ("sharedWithItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
