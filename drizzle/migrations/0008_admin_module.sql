ALTER TABLE "user" ADD COLUMN "role" text NOT NULL DEFAULT 'user';
ALTER TABLE "user" ADD COLUMN "suspended_at" timestamp;
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp;

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text NOT NULL,
  "metadata" json,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);