/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `ClientInvites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClientInvites_email_key" ON "ClientInvites"("email");
