# Hyper Desktop - Architecture et Implémentation

## Vue d'ensemble

Cette implémentation convertit l'application Next.js "Hyper" en une application desktop Windows en utilisant Electron, tout en conservant l'architecture cloud existante (Neon Database, Redis, etc.).

## Architecture

```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  ┌────────────────────────────────┐    │
│  │   API Keys Manager (chiffré)   │    │
│  └────────────────────────────────┘    │
│                  │                      │
│  ┌───────────────▼──────────────────┐  │
│  │   Next.js Server (embedded)     │  │
│  │   - Port 3000                   │  │
│  │   - Standalone build            │  │
│  └───────────────┬──────────────────┘  │
│                  │                      │
│  ┌───────────────▼──────────────────┐  │
│  │   BrowserWindow                 │  │
│  │   - Preload Script (IPC)        │  │
│  │   - Context Isolation           │  │
│  └───────────────┬──────────────────┘  │
└──────────────────┼──────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │   React Components          │
    │   - useElectron() hook      │
    │   - TitleBar                │
    │   - NetworkStatus           │
    └─────────────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │   Cloud Services            │
    │   - Neon PostgreSQL         │
    │   - Upstash Redis           │
    │   - Vercel Blob             │
    │   - Google AI (Gemini)      │
    └─────────────────────────────┘
```

## Composants clés

### 1. Main Process (electron/main.cjs)

**Responsabilités:**
- Démarrer le serveur Next.js embarqué
- Gérer le cycle de vie de l'application
- Créer et gérer les fenêtres
- Gérer le menu natif
- Chiffrer/déchiffrer les clés API

**Fonctionnalités:**
```javascript
// Détection du mode (dev vs production)
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Chiffrement sécurisé des clés
safeStorage.encryptString(apiKey) → stocké dans electron-store

// Menu natif en français
Menu.buildFromTemplate(template)
```

### 2. Preload Script (electron/preload.cjs)

**Responsabilités:**
- Bridge sécurisé entre main et renderer
- Exposer l'API Electron au frontend via `contextBridge`

**API exposée:**
```javascript
window.electronAPI = {
  getAppVersion() → string
  getPlatform() → 'win32' | 'darwin' | 'linux'
  isElectron() → boolean
  showNotification(title, body) → void
  copyToClipboard(text) → void
}
```

### 3. API Keys Manager (electron/api-keys-manager.cjs)

**Responsabilités:**
- Stocker les clés de manière sécurisée
- Chiffrer avec `safeStorage` d'Electron
- Fallback vers stockage non chiffré si nécessaire

**Clés gérées:**
- API externes: Gemini, EXA, Tavily, Serper, etc.
- Base de données: DATABASE_URL, REDIS_URL
- Authentification: LOCAL_AUTH_SECRET
- Services: Pusher, Blob Storage

### 4. React Hook (hooks/use-electron.ts)

**Responsabilités:**
- Détecter l'environnement Electron
- Fournir l'état de l'application (version, plateforme)
- Wrapper pour les notifications

**Utilisation:**
```typescript
const { isElectron, appVersion, showNotification } = useElectron();

if (isElectron) {
  showNotification('Recherche terminée', 'Résultats disponibles');
}
```

### 5. Composants Electron (components/electron/)

#### TitleBar
- Barre de titre personnalisée (optionnelle)
- Affiche la version de l'app
- Indicateur de connexion cloud

#### NetworkStatus
- Détecte les changements de connectivité
- Affiche un badge vert/rouge
- Avertit l'utilisateur si hors ligne

## Flux de données

### Démarrage de l'application

1. **Main Process démarre**
   ```
   app.whenReady() 
   → initializeApiKeys() (charge/chiffre les clés)
   → startNextServer() (lance Next.js)
   → createWindow() (ouvre la fenêtre)
   ```

2. **Next.js démarre**
   ```
   Variables d'env injectées par getEnvironmentVariables()
   → Server démarre sur port 3000
   → Ready event émis
   ```

3. **Window charge**
   ```
   BrowserWindow.loadURL('http://localhost:3000')
   → Preload script s'exécute
   → React app démarre
   → useElectron() détecte Electron
   → Composants Electron s'affichent
   ```

### Communication IPC

```
┌─────────────┐                 ┌──────────────┐
│   Renderer  │  IPC Invoke     │ Main Process │
│   Process   │ ─────────────>  │              │
│ (React App) │                 │ (Node.js)    │
│             │  <───────────── │              │
└─────────────┘   IPC Reply     └──────────────┘
```

**Exemple:**
```typescript
// Renderer
const version = await window.electronAPI.getAppVersion();

// Main
ipcMain.handle('get-app-version', () => app.getVersion());
```

## Build Process

### Développement

```bash
pnpm electron:dev
```

1. Next.js démarre en mode turbopack
2. `wait-on` attend que localhost:3000 soit prêt
3. Electron démarre et se connecte au serveur Next.js
4. Hot-reload fonctionne normalement

### Production

```bash
pnpm electron:build-win
```

1. **Next.js build**
   ```
   next build --turbopack
   → Crée .next/standalone (serveur autonome)
   → Crée .next/static (assets optimisés)
   ```

2. **Electron build**
   ```
   electron-builder --win --x64
   → Copie .next/standalone vers resources/app
   → Package Electron + Node.js + Next.js
   → Crée installateur NSIS
   ```

3. **Output**
   ```
   dist-electron/
   └── Hyper Desktop-Setup-0.1.0.exe (150-200 MB)
   ```

## Sécurité

### Clés API

- **Stockage:** `electron-store` avec chiffrement
- **Emplacement:** `%APPDATA%/hyper-config/` (Windows)
- **Chiffrement:** `safeStorage.encryptString()` utilise DPAPI (Windows)
- **Déchiffrement:** Uniquement par le même utilisateur sur la même machine

### Context Isolation

```javascript
webPreferences: {
  nodeIntegration: false,        // Pas d'accès Node dans le renderer
  contextIsolation: true,        // Isolation complète
  preload: 'preload.cjs',       // Bridge contrôlé
  webSecurity: true              // Sécurité web activée
}
```

### Content Security Policy

Les mêmes headers CSP que la version web sont appliqués via `next.config.ts`.

## Gestion des erreurs

### Serveur Next.js crash

```javascript
nextServer.on('error', (err) => {
  // Log l'erreur
  // Affiche dialog à l'utilisateur
  // Tente de redémarrer ou quitte
});
```

### Perte de connexion

Le composant `NetworkStatus` détecte via:
```javascript
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);
```

### Clés API invalides

Les erreurs API sont gérées côté Next.js (comme en production web).

## Performance

### Optimisations

1. **Next.js Standalone**
   - Uniquement les fichiers nécessaires
   - Pas de node_modules complet
   - ~50MB au lieu de ~500MB

2. **Electron**
   - Single instance lock
   - Lazy loading des fenêtres
   - GPU acceleration activée

3. **Build**
   - Compression NSIS
   - Assets optimisés par Next.js
   - Tree-shaking automatique

## Différences Web vs Desktop

| Fonctionnalité | Web | Desktop |
|----------------|-----|---------|
| Authentification | OAuth (GitHub, Google) | Local (admin/admin123) |
| Base de données | Neon Cloud | Neon Cloud (connexion requise) |
| Clés API | Variables d'env Vercel | Stockage chiffré local |
| Menu | Navbar React | Menu natif Windows |
| Notifications | Web API | Native Windows |
| Redirections | Externes autorisées | Ouvrent navigateur externe |

## Tests

### Checklist fonctionnelle

- [ ] Démarrage de l'application
- [ ] Connexion admin
- [ ] Recherche IA
- [ ] Chat multi-modèles
- [ ] Panneau Admin
- [ ] Lookout
- [ ] XQL
- [ ] Menu natif (tous les items)
- [ ] Raccourcis clavier
- [ ] Notifications
- [ ] Mode hors ligne (message approprié)
- [ ] Liens externes (s'ouvrent dans navigateur)

### Tests de build

1. **Sur machine de développement**
   ```bash
   pnpm electron:pack  # Test sans installateur
   ```

2. **Sur machine propre (VM)**
   - Installer depuis l'exe
   - Tester toutes les fonctionnalités
   - Vérifier le désinstallateur

## Déploiement

### Option 1: Distribution directe

Partager `Hyper Desktop-Setup-0.1.0.exe` via:
- OneDrive, Google Drive
- Site web privé
- Réseau d'entreprise

### Option 2: Signature de code

Pour éviter les avertissements Windows:
1. Acheter certificat EV (DigiCert, Sectigo)
2. Signer avec `electron-builder`:
   ```json
   "win": {
     "certificateFile": "cert.pfx",
     "certificatePassword": "password"
   }
   ```

### Option 3: Auto-update

Implémenter `electron-updater` pour les mises à jour automatiques.

## Maintenance

### Mise à jour des clés

```javascript
// Option 1: Supprimer le stockage
// Windows: %APPDATA%/hyper-config/

// Option 2: Modifier electron/main.cjs et rebuild
```

### Mise à jour Next.js

```bash
pnpm update next react react-dom
pnpm electron:build-win  # Rebuild complet
```

### Logs de debug

En production:
```
%APPDATA%/hyper-desktop/logs/
```

En développement:
```
Affichage > Outils développeur (Ctrl+Shift+I)
```

## Limitations connues

1. **Connexion Internet requise** - Utilise Neon Cloud
2. **Windows uniquement** - Configuration actuelle (peut être étendu à macOS/Linux)
3. **Port 3000** - Doit être disponible
4. **Taille de l'installateur** - ~150-200 MB (Next.js + Electron + Node.js)

## Évolutions possibles

1. **Base de données locale** - SQLite pour mode offline
2. **Multi-plateforme** - Builds macOS et Linux
3. **Auto-update** - Mises à jour automatiques
4. **Multi-fenêtres** - Plusieurs recherches en parallèle
5. **Tray icon** - Minimiser dans la barre des tâches
6. **Raccourcis globaux** - Ouvrir avec Win+Space par exemple
