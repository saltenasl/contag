/*
  Warnings:

  - You are about to drop the column `userId` on the `ClientInvites` table. All the data in the column will be lost.
  - Added the required column `createdByUserId` to the `ClientInvites` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClientInvites" DROP CONSTRAINT "ClientInvites_userId_fkey";

-- AlterTable
ALTER TABLE "ClientInvites" DROP COLUMN "userId",
ADD COLUMN     "createdByUserId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ClientInvites" ADD CONSTRAINT "ClientInvites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
