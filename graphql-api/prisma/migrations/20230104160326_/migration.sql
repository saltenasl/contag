/*
  Warnings:

  - A unique constraint covering the columns `[userId,parentItemId,parentUserId]` on the table `FeedActivity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FeedActivity_userId_parentItemId_parentUserId_key" ON "FeedActivity"("userId", "parentItemId", "parentUserId");
