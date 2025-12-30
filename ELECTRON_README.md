# Hyper Desktop - Version Electron

## Prérequis

- Node.js 20+
- pnpm 10+
- Windows (pour le build final)

## Installation

```bash
pnpm install
```

## Développement

Lancer l'application en mode développement :

```bash
pnpm electron:dev
```

Cela démarre le serveur Next.js et ouvre l'application Electron une fois le serveur prêt.

## Configuration des Clés API

✅ **Les clés API sont déjà configurées** dans `electron/main.cjs` avec vos clés de production.

**Important**: 
- Les clés sont chiffrées localement au premier lancement en utilisant `safeStorage` d'Electron
- En mode développement, les variables peuvent aussi être lues depuis `.env.electron`
- Les clés sont stockées de manière sécurisée dans `%APPDATA%/hyper-config/` sur Windows

## Build pour Windows

### 1. Préparer les icônes

Placez les fichiers suivants dans le dossier `build/` :
- `icon.ico` - Icône Windows (256x256 pixels)
- `installerHeader.bmp` - Header installateur (150x57 pixels) - optionnel
- `installerSidebar.bmp` - Sidebar installateur (164x314 pixels) - optionnel

Vous pouvez convertir `public/hyper.png` en `.ico` avec des outils en ligne.

### 2. Build complet

```bash
pnpm electron:build-win
```

Ou étape par étape :

```bash
# Build Next.js
pnpm build

# Packager avec Electron
pnpm electron:dist
```

L'installateur sera généré dans `dist-electron/`.

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `pnpm electron:dev` | Développement avec hot-reload |
| `pnpm electron:build` | Build Next.js + Electron |
| `pnpm electron:pack` | Package sans créer d'installateur |
| `pnpm electron:dist` | Créer l'installateur Windows |
| `pnpm electron:build-win` | Script complet de build Windows |

## Architecture

```
electron/
├── main.cjs          # Processus principal Electron
├── preload.cjs       # Script preload (bridge sécurisé)
└── api-keys-manager.cjs  # Gestion chiffrée des clés API

components/electron/
├── title-bar.tsx     # Barre de titre custom (optionnelle)
├── network-status.tsx # Indicateur de connexion
└── index.tsx         # Exports

hooks/
└── use-electron.ts   # Hook React pour détecter Electron

env/
└── electron.ts       # Variables d'environnement Electron
```

## Fonctionnalités

- ✅ Toutes les fonctionnalités de l'app web
- ✅ Menu natif Windows
- ✅ Raccourcis clavier
- ✅ Notifications natives
- ✅ Stockage sécurisé des clés API
- ✅ Indicateur de connexion réseau
- ✅ Liens externes ouverts dans le navigateur par défaut

## Notes importantes

1. **Connexion Internet requise** - L'application utilise Neon Cloud pour la base de données
2. **Taille de l'installateur** - ~150-200 MB (Next.js + Electron + Node.js)
3. **Signature de code** - Recommandé pour la distribution (certificat EV)

## Dépannage

### L'application ne démarre pas

Vérifiez que le port 3000 n'est pas utilisé :
```bash
netstat -ano | findstr :3000
```

### Erreurs de clés API

Les clés sont stockées dans :
- Windows: `%APPDATA%/hyper-config/`

Pour réinitialiser, supprimez ce dossier.

### Build échoue

1. Vérifiez que Node.js 20+ est installé
2. Supprimez `node_modules` et `.next` puis réinstallez
3. Assurez-vous que `icon.ico` existe dans `build/`
