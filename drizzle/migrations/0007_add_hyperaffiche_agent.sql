-- Migration: 0007_add_hyperaffiche_agent.sql
-- Add HyperAffiche agent access to all active users

INSERT INTO "user_agent_access" ("id", "user_id", "agent_id", "enabled", "created_at", "updated_at")
SELECT 
  'access_' || u.id || '_hyperaffiche',
  u.id,
  'hyperaffiche',
  true,
  NOW(),
  NOW()
FROM "user" u
ON CONFLICT ("user_id", "agent_id") DO NOTHING;
