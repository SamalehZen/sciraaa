-- Migration pour mettre à jour les enregistrements existants
-- Cette migration met masked à false pour tous les enregistrements existants
-- qui n'ont pas encore ce champ (pour les utilisateurs créés avant la migration)

UPDATE user_agent_access 
SET masked = false 
WHERE masked IS NULL;

-- Vérifier le résultat
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN masked = true THEN 1 END) as masked_count,
  COUNT(CASE WHEN masked = false THEN 1 END) as visible_count
FROM user_agent_access;
