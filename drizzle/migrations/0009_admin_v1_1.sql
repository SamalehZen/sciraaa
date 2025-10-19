-- Admin V1.1: message mode + product models access

-- Add message mode column
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "mode" varchar NOT NULL DEFAULT 'non_streaming';
CREATE INDEX IF NOT EXISTS "message_mode_idx" ON "message" ("mode");

-- Product models catalog
CREATE TABLE IF NOT EXISTS "model" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "status" varchar NOT NULL DEFAULT 'active',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "model_status_idx" ON "model" ("status");

-- User access to product models
CREATE TABLE IF NOT EXISTS "user_model_access" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "model_id" uuid NOT NULL REFERENCES "model"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_model_access_user_model_unique" ON "user_model_access" ("user_id", "model_id");
