/*
  Warnings:

  - You are about to drop the column `messageId` on the `Audience` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[itemId]` on the table `Audience` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `Audience` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Audience" DROP CONSTRAINT "Audience_messageId_fkey";

-- DropIndex
DROP INDEX "Audience_messageId_key";

-- AlterTable
ALTER TABLE "Audience" DROP COLUMN "messageId",
ADD COLUMN     "itemId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Audience_itemId_key" ON "Audience"("itemId");

-- AddForeignKey
ALTER TABLE "Audience" ADD CONSTRAINT "Audience_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
