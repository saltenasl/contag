-- CreateTable
CREATE TABLE "FeedActivity" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentUserId" INTEGER,
    "parentItemId" INTEGER,
    "lastActivity" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedActivity" ADD CONSTRAINT "FeedActivity_parentItemId_fkey" FOREIGN KEY ("parentItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
