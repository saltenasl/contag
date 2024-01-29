-- migrates fulfilled status values from being dynamically calculated to a field in database

-- update tasks

UPDATE "ActionExpectation"
SET FULFILLED = TRUE
FROM "Item",
	"Task"
WHERE "ActionExpectation"."itemId" = "Item"."id"
	AND "Item"."taskId" = "Task"."id"
	AND "Task".STATUS = 'DONE'
	AND "ActionExpectation".FULFILLED = FALSE;

-- update infos

UPDATE "ActionExpectation"
SET FULFILLED = TRUE
FROM "Item",
    "Info"
WHERE "ActionExpectation"."itemId" = "Item"."id"
    AND "Item"."infoId" = "Info"."id"
    AND "Info".ACKNOWLEDGED = true;

-- update questions

UPDATE "ActionExpectation"
SET FULFILLED = TRUE
FROM "Item",
    "Question"
WHERE "ActionExpectation"."itemId" = "Item"."id"
    AND "Item"."questionId" = "Question"."id"
    AND "Question"."answerId" IS NOT NULL;
