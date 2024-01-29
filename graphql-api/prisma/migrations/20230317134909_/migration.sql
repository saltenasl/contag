-- CreateTable
CREATE TABLE "_item-blocks-is-blocked-by" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_item-blocks-is-blocked-by_AB_unique" ON "_item-blocks-is-blocked-by"("A", "B");

-- CreateIndex
CREATE INDEX "_item-blocks-is-blocked-by_B_index" ON "_item-blocks-is-blocked-by"("B");

-- AddForeignKey
ALTER TABLE "_item-blocks-is-blocked-by" ADD CONSTRAINT "_item-blocks-is-blocked-by_A_fkey" FOREIGN KEY ("A") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_item-blocks-is-blocked-by" ADD CONSTRAINT "_item-blocks-is-blocked-by_B_fkey" FOREIGN KEY ("B") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
