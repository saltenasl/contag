/*
  Warnings:

  - Added the required column `userId` to the `ClientInvites` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClientInvites" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ClientInvites" ADD CONSTRAINT "ClientInvites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
