/*
  Warnings:

  - You are about to drop the column `toId` on the `Audience` table. All the data in the column will be lost.
  - Added the required column `audienceId` to the `Recipient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Audience" DROP CONSTRAINT "Audience_toId_fkey";

-- AlterTable
ALTER TABLE "Audience" DROP COLUMN "toId";

-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "audienceId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "Audience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
