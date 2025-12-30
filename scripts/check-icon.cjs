const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const iconExists = fs.existsSync(path.join(buildDir, 'icon.ico'));

if (!iconExists) {
  console.log(`
⚠️  ATTENTION: Icône Windows manquante!

Pour créer l'icône Windows (icon.ico) :

1. Méthode en ligne (recommandée) :
   - Allez sur https://convertio.co/fr/png-ico/
   - Uploadez public/hyper.png
   - Téléchargez icon.ico
   - Placez-le dans le dossier build/

2. Méthode avec ImageMagick (si installé) :
   convert public/hyper.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico

3. Méthode avec Node.js :
   npm install -g png-to-ico
   png-to-ico public/hyper.png build/icon.ico --sizes 256

Sans icon.ico, le build échouera!
`);
  process.exit(1);
}

console.log('✅ Icône Windows détectée');
process.exit(0);
