ALTER TABLE "Goal" ADD COLUMN     "richTextJSON" JSONB;
ALTER TABLE "Info" ADD COLUMN     "richTextJSON" JSONB;
ALTER TABLE "Message" ADD COLUMN     "richTextJSON" JSONB;
ALTER TABLE "Question" ADD COLUMN     "richTextJSON" JSONB;
ALTER TABLE "Summary" ADD COLUMN     "richTextJSON" JSONB;
ALTER TABLE "Task" ADD COLUMN     "richTextJSON" JSONB;

UPDATE "Goal" SET "richTextJSON"="richText"::JSONB;
UPDATE "Info" SET "richTextJSON"="richText"::JSONB;
UPDATE "Message" SET "richTextJSON"="richText"::JSONB;
UPDATE "Question" SET "richTextJSON"="richText"::JSONB;
UPDATE "Summary" SET "richTextJSON"="richText"::JSONB;
UPDATE "Task" SET "richTextJSON"="richText"::JSONB;

ALTER TABLE "Goal" DROP COLUMN "richText";
ALTER TABLE "Info" DROP COLUMN "richText";
ALTER TABLE "Message" DROP COLUMN "richText";
ALTER TABLE "Question" DROP COLUMN "richText";
ALTER TABLE "Summary" DROP COLUMN "richText";
ALTER TABLE "Task" DROP COLUMN "richText";

ALTER TABLE "Goal" RENAME COLUMN "richTextJSON" to "richText";
ALTER TABLE "Info" RENAME COLUMN "richTextJSON" to "richText";
ALTER TABLE "Message" RENAME COLUMN "richTextJSON" to "richText";
ALTER TABLE "Question" RENAME COLUMN "richTextJSON" to "richText";
ALTER TABLE "Summary" RENAME COLUMN "richTextJSON" to "richText";
ALTER TABLE "Task" RENAME COLUMN "richTextJSON" to "richText";
