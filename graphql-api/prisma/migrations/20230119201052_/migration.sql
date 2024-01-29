-- CreateTable
CREATE TABLE "ActionExpectation" (
    "id" SERIAL NOT NULL,
    "completeUntil" TIMESTAMP(3) NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "ActionExpectation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActionExpectation_itemId_key" ON "ActionExpectation"("itemId");

-- AddForeignKey
ALTER TABLE "ActionExpectation" ADD CONSTRAINT "ActionExpectation_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
