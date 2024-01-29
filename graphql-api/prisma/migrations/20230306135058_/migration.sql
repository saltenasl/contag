-- CreateTable
CREATE TABLE "_goal-constituents" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_goal-constituents_AB_unique" ON "_goal-constituents"("A", "B");

-- CreateIndex
CREATE INDEX "_goal-constituents_B_index" ON "_goal-constituents"("B");

-- AddForeignKey
ALTER TABLE "_goal-constituents" ADD CONSTRAINT "_goal-constituents_A_fkey" FOREIGN KEY ("A") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_goal-constituents" ADD CONSTRAINT "_goal-constituents_B_fkey" FOREIGN KEY ("B") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
