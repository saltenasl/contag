/*
  Warnings:

  - A unique constraint covering the columns `[goalId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('TODO', 'DONE');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "goalId" INTEGER;

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'TODO',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_fullTextSearchColumn_idx" ON "Goal" USING GIN ("fullTextSearchColumn");

-- CreateIndex
CREATE UNIQUE INDEX "Item_goalId_key" ON "Item"("goalId");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
