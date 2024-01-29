/*
  Warnings:

  - A unique constraint covering the columns `[infoId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "infoId" INTEGER;

-- CreateTable
CREATE TABLE "Info" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Item_infoId_key" ON "Item"("infoId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_infoId_fkey" FOREIGN KEY ("infoId") REFERENCES "Info"("id") ON DELETE SET NULL ON UPDATE CASCADE;
