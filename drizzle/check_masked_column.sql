-- Vérifier si la colonne 'masked' existe dans la table user_agent_access
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_agent_access'
ORDER BY ordinal_position;

-- Si la colonne n'existe pas, exécutez cette migration:
-- ALTER TABLE "user_agent_access" ADD COLUMN "masked" boolean NOT NULL DEFAULT false;
