-- AlterTable
ALTER TABLE "Info" ADD COLUMN     "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "fullTextSearchColumn" tsvector GENERATED ALWAYS AS (to_tsvector('english', description)) STORED;

-- CreateIndex
CREATE INDEX "Info_fullTextSearchColumn_idx" ON "Info" USING GIN ("fullTextSearchColumn");

-- CreateIndex
CREATE INDEX "Message_fullTextSearchColumn_idx" ON "Message" USING GIN ("fullTextSearchColumn");

-- CreateIndex
CREATE INDEX "Question_fullTextSearchColumn_idx" ON "Question" USING GIN ("fullTextSearchColumn");

-- CreateIndex
CREATE INDEX "Task_fullTextSearchColumn_idx" ON "Task" USING GIN ("fullTextSearchColumn");
