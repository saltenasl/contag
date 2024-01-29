-- AlterTable
ALTER TABLE "Summary" ADD COLUMN     "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

-- CreateIndex
CREATE INDEX "Summary_fullTextSearchColumn_idx" ON "Summary" USING GIN ("fullTextSearchColumn");
