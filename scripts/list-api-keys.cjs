#!/usr/bin/env node

/**
 * Script pour lister toutes les clés API configurées dans electron/main.cjs
 * 
 * Usage:
 *   node scripts/list-api-keys.cjs
 */

const fs = require('fs');
const path = require('path');

const mainFilePath = path.join(__dirname, '..', 'electron', 'main.cjs');

try {
  const content = fs.readFileSync(mainFilePath, 'utf8');

  // Extraire la section DEFAULT_API_KEYS
  const keysMatch = content.match(/const DEFAULT_API_KEYS = \{([^}]+)\}/s);
  
  if (!keysMatch) {
    console.error('❌ Section DEFAULT_API_KEYS non trouvée');
    process.exit(1);
  }

  const keysSection = keysMatch[1];
  
  // Extraire chaque clé
  const keyRegex = /(\w+):\s*process\.env\.\w+\s*\|\|\s*['"]([^'"]+)['"]/g;
  const keys = [];
  let match;

  while ((match = keyRegex.exec(keysSection)) !== null) {
    const keyName = match[1];
    const keyValue = match[2];
    const preview = keyValue.length > 20 
      ? `${keyValue.slice(0, 10)}...${keyValue.slice(-4)}`
      : keyValue;
    
    keys.push({ name: keyName, preview });
  }

  console.log('\n📋 Clés API configurées dans electron/main.cjs:\n');
  console.log('┌────────────────────────────────────┬──────────────────────┐');
  console.log('│ Nom de la clé                      │ Aperçu               │');
  console.log('├────────────────────────────────────┼──────────────────────┤');
  
  keys.forEach(key => {
    const namePadded = key.name.padEnd(34);
    const previewPadded = key.preview.padEnd(20);
    console.log(`│ ${namePadded} │ ${previewPadded} │`);
  });
  
  console.log('└────────────────────────────────────┴──────────────────────┘');
  console.log(`\n✅ Total: ${keys.length} clés\n`);

} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}
