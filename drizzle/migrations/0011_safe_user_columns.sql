BEGIN;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
ALTER TABLE "public"."user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DEFAULT 'user';
UPDATE "public"."user" SET "role" = 'user' WHERE "role" IS NULL;
ALTER TABLE "public"."user" ALTER COLUMN "role" SET NOT NULL;
COMMIT;