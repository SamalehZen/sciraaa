const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building Hyper Desktop for Windows...\n');

try {
  console.log('📦 Building Next.js standalone...');
  execSync('pnpm build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  const standalonePath = path.join(__dirname, '..', '.next', 'standalone');
  if (fs.existsSync(standalonePath)) {
    console.log('\n✅ Next.js standalone build created successfully');
  } else {
    console.warn('\n⚠️  Standalone folder not found - build may be incomplete');
  }

  console.log('\n⚡ Building Electron app...');
  execSync('electron-builder --win --x64', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n✅ Build complete! Check dist-electron/ folder');
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
