CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" text PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "value" json NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Créer l'index sur la clé
CREATE UNIQUE INDEX IF NOT EXISTS "app_settings_key_idx" ON "app_settings" ("key");

-- Insérer les paramètres par défaut pour les agents masqués
INSERT INTO "app_settings" ("id", "key", "value", "created_at", "updated_at")
VALUES (
  'global_hidden_agents',
  'global_hidden_agents',
  '[]'::json,
  now(),
  now()
)
ON CONFLICT (key) DO NOTHING;
