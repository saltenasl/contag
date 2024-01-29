/*
  Warnings:

  - You are about to drop the column `parentId` on the `Message` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_parentId_fkey";

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "parentId" INTEGER;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "parentId";

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
