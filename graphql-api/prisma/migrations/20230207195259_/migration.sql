-- Create action expectation for non message items that were previously missing them

INSERT INTO "ActionExpectation" ("itemId")
SELECT "Item"."id"
FROM "Item"
FULL OUTER JOIN "ActionExpectation" ON "ActionExpectation"."itemId" = "Item"."id"
WHERE "Item"."messageId" IS NULL
	AND "ActionExpectation"."id" IS NULL;