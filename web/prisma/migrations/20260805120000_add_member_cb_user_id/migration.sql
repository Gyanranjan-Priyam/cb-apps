-- Add a permanent CB user id for members
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "cbUserId" TEXT;

WITH numbered AS (
  SELECT
    id,
    row_number() OVER (ORDER BY "createdAt" ASC, id ASC) AS rn
  FROM "user"
  WHERE "role" IS DISTINCT FROM 'admin'
    AND "cbUserId" IS NULL
)
UPDATE "user" AS u
SET "cbUserId" = 'CB-' || lpad(numbered.rn::text, 5, '0')
FROM numbered
WHERE u.id = numbered.id;

CREATE UNIQUE INDEX IF NOT EXISTS "user_cbUserId_key" ON "user"("cbUserId");