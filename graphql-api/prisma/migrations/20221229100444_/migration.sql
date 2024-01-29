-- DropForeignKey
ALTER TABLE "UserClient" DROP CONSTRAINT "UserClient_addedByUserId_fkey";

-- AlterTable
ALTER TABLE "UserClient" ALTER COLUMN "addedByUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
