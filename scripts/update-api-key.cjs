#!/usr/bin/env node

/**
 * Script pour changer rapidement une clé API dans electron/main.cjs
 * 
 * Usage:
 *   node scripts/update-api-key.cjs <NOM_CLE> <NOUVELLE_VALEUR>
 * 
 * Exemple:
 *   node scripts/update-api-key.cjs GOOGLE_GENERATIVE_AI_API_KEY "AIzaSy..."
 */

const fs = require('fs');
const path = require('path');

const mainFilePath = path.join(__dirname, '..', 'electron', 'main.cjs');

if (process.argv.length < 4) {
  console.error('❌ Erreur: Arguments manquants');
  console.log('\nUsage:');
  console.log('  node scripts/update-api-key.cjs <NOM_CLE> <NOUVELLE_VALEUR>');
  console.log('\nExemple:');
  console.log('  node scripts/update-api-key.cjs GOOGLE_GENERATIVE_AI_API_KEY "AIzaSy..."');
  console.log('\nClés disponibles:');
  console.log('  - GOOGLE_GENERATIVE_AI_API_KEY');
  console.log('  - GEMINI_API_KEY');
  console.log('  - EXA_API_KEY');
  console.log('  - TAVILY_API_KEY');
  console.log('  - DATABASE_URL');
  console.log('  - REDIS_URL');
  console.log('  - SERPER_API_KEY');
  console.log('  - ... et autres');
  process.exit(1);
}

const keyName = process.argv[2];
const newValue = process.argv[3];

try {
  // Lire le fichier main.cjs
  let content = fs.readFileSync(mainFilePath, 'utf8');

  // Trouver et remplacer la clé
  const regex = new RegExp(
    `(${keyName}:\\s*process\\.env\\.${keyName}\\s*\\|\\|\\s*['"])([^'"]+)(['"])`,
    'g'
  );

  const match = content.match(regex);
  if (!match) {
    console.error(`❌ Clé "${keyName}" non trouvée dans electron/main.cjs`);
    process.exit(1);
  }

  // Remplacer la valeur
  content = content.replace(regex, `$1${newValue}$3`);

  // Sauvegarder
  fs.writeFileSync(mainFilePath, content, 'utf8');

  console.log(`✅ Clé "${keyName}" mise à jour avec succès!`);
  console.log(`\n📝 Nouvelle valeur: ${newValue.slice(0, 10)}...${newValue.slice(-4)}`);
  console.log(`\n⚠️  N'oubliez pas de rebuild l'application:`);
  console.log(`   pnpm electron:build-win`);

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
