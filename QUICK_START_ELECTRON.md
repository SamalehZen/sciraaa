# Guide de Démarrage Rapide - Hyper Desktop

## Étape 1: Installation des dépendances

```bash
cd /path/to/sciraaa
pnpm install
```

## Étape 2: Tester en mode développement

```bash
pnpm electron:dev
```

Cela va:
1. Démarrer le serveur Next.js sur http://localhost:3000
2. Ouvrir l'application Electron une fois le serveur prêt

## Étape 3: Créer l'icône Windows

### Option A: Convertisseur en ligne (le plus simple)

1. Allez sur https://convertio.co/fr/png-ico/
2. Uploadez `public/hyper.png`
3. Téléchargez `icon.ico`
4. Placez-le dans le dossier `build/`

### Option B: Avec ImageMagick (si installé)

```bash
convert public/hyper.png -define icon:auto-resize=256,128,64,48,32,16 build/icon.ico
```

### Option C: Avec png-to-ico (Node.js)

```bash
npm install -g png-to-ico
png-to-ico public/hyper.png build/icon.ico --sizes 256
```

## Étape 4: Vérifier l'icône

```bash
node scripts/check-icon.cjs
```

## Étape 5: Build pour Windows

```bash
pnpm electron:build-win
```

L'installateur sera créé dans `dist-electron/Hyper Desktop-Setup-0.1.0.exe`

## Fonctionnalités testées

- ✅ Connexion admin (admin@scira.local / admin123)
- ✅ Recherche avec IA
- ✅ Chat avec différents modèles
- ✅ Panneau Admin
- ✅ Lookout (recherches programmées)
- ✅ XQL
- ✅ Menu natif Windows
- ✅ Raccourcis clavier (Ctrl+N, Ctrl+H, etc.)
- ✅ Indicateur de connexion réseau

## Dépannage

### Port 3000 déjà utilisé

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erreur de build

1. Supprimez les dossiers temporaires:
```bash
rm -rf node_modules .next dist-electron
```

2. Réinstallez:
```bash
pnpm install
```

### L'application ne démarre pas

Vérifiez la console Electron (Affichage > Outils développeur) pour voir les erreurs.

## Structure des clés API

Les clés sont déjà configurées dans `electron/main.cjs` et chiffrées au premier lancement.

En mode développement, vous pouvez aussi créer un fichier `.env.electron` basé sur `.env.electron.example`.

## Prochaines étapes

1. Testez toutes les fonctionnalités
2. Créez l'icône Windows
3. Buildez l'installateur
4. Testez l'installateur sur une machine Windows propre
5. (Optionnel) Signez le code pour éviter les avertissements Windows Defender
