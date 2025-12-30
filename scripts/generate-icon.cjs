const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'hyper.png');
const outputDir = path.join(__dirname, '..', 'build');
const outputPath = path.join(outputDir, 'icon.png');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcon() {
  try {
    await sharp(inputPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log('✅ Icône PNG créée: build/icon.png');
    console.log('');
    console.log('⚠️  Pour créer icon.ico, utilisez un convertisseur en ligne:');
    console.log('   https://convertio.co/fr/png-ico/');
    console.log('');
    console.log('   Ou avec ImageMagick:');
    console.log('   convert build/icon.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico');
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'icône:', error.message);
    process.exit(1);
  }
}

generateIcon();
