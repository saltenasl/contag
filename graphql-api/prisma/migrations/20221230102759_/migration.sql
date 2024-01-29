-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_messageId_key" ON "Item"("messageId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
