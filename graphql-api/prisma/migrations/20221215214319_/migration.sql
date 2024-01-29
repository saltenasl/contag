/*
  Warnings:

  - A unique constraint covering the columns `[email,clientId]` on the table `ClientInvites` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ClientInvites_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "ClientInvites_email_clientId_key" ON "ClientInvites"("email", "clientId");
