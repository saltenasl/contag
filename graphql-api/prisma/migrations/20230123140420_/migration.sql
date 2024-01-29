-- CreateTable
CREATE TABLE "Summary" (
    "id" SERIAL NOT NULL,
    "addedById" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "shouldReplaceOriginalItem" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summary_itemId_key" ON "Summary"("itemId");

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
