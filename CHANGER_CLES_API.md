# Guide: Changer les Clés API après le Build

## 🎯 Trois Méthodes Possibles

---

## Méthode 1: AVANT Distribution (Recommandé)

**Quand:** Tu n'as pas encore distribué le .exe aux utilisateurs

### Étapes:

1. **Ouvre le fichier de configuration**
   ```
   electron/main.cjs
   ```

2. **Trouve la section DEFAULT_API_KEYS (ligne 27)**
   ```javascript
   const DEFAULT_API_KEYS = {
     GOOGLE_GENERATIVE_AI_API_KEY: 'AIzaSyBxu15F8LevYrOlTDuzYZL6HhlkZr4hoH4',
     GEMINI_API_KEY: 'AIzaSyDGRMh1j5gNtm5FiEvnZzBRzLA0bDUwPtI',
     // ... autres clés
   };
   ```

3. **Change la clé que tu veux modifier**
   ```javascript
   GOOGLE_GENERATIVE_AI_API_KEY: 'NOUVELLE_CLE_ICI',
   ```

4. **Rebuild l'application**
   ```bash
   pnpm electron:build-win
   ```

5. **Distribue le nouveau .exe**
   ```
   dist-electron/Hyper Desktop-Setup-0.1.0.exe
   ```

**✅ Avantages:**
- Simple et rapide
- Les utilisateurs reçoivent directement la bonne version

---

## Méthode 2: Interface de Gestion (Nouveau!)

**Quand:** L'app est déjà installée chez les utilisateurs

### J'ai créé une interface pour mettre à jour les clés SANS rebuilder!

**A. Dans l'application installée:**

1. **Ajoute un menu "Paramètres API"** dans `electron/main.cjs`:

   Trouve la fonction `createMenu()` (ligne 150) et ajoute:
   ```javascript
   {
     label: 'Navigation',
     submenu: [
       { label: 'Accueil', accelerator: 'CmdOrCtrl+H', click: () => mainWindow.loadURL(`http://localhost:${PORT}`) },
       { label: 'Admin', click: () => mainWindow.loadURL(`http://localhost:${PORT}/admin`) },
       { label: 'Lookout', click: () => mainWindow.loadURL(`http://localhost:${PORT}/lookout`) },
       { label: 'XQL', click: () => mainWindow.loadURL(`http://localhost:${PORT}/xql`) },
       { type: 'separator' },
       { label: 'Gérer les clés API', click: () => mainWindow.loadURL(`http://localhost:${PORT}/settings/api-keys`) }  // ← NOUVEAU
     ]
   },
   ```

2. **Crée la page de gestion** `app/settings/api-keys/page.tsx`:
   ```tsx
   import { ApiKeysManager } from '@/components/electron';

   export default function ApiKeysPage() {
     return (
       <div className="container mx-auto p-8">
         <ApiKeysManager />
       </div>
     );
   }
   ```

3. **Dans l'app, va dans:**
   ```
   Menu > Navigation > Gérer les clés API
   ```

4. **Utilise l'interface:**
   - Sélectionne la clé à modifier
   - Entre la nouvelle valeur
   - Clique sur "Mettre à jour"
   - **Redémarre l'application**

**✅ Avantages:**
- Pas besoin de rebuilder
- L'utilisateur peut le faire lui-même
- Les clés restent chiffrées

**⚠️ Inconvénient:**
- Il faut rebuilder UNE FOIS pour ajouter cette interface
- Puis les utilisateurs peuvent modifier les clés sans rebuild

---

## Méthode 3: Nouvelle Version (Pour mises à jour majeures)

**Quand:** Tu veux distribuer une nouvelle version complète

### Étapes:

1. **Change les clés dans `electron/main.cjs`** (comme Méthode 1)

2. **Change la version dans `package.json`**
   ```json
   {
     "version": "0.2.0",  // ← Était 0.1.0
   }
   ```

3. **Rebuild**
   ```bash
   pnpm electron:build-win
   ```

4. **Distribue le nouveau .exe**
   ```
   dist-electron/Hyper Desktop-Setup-0.2.0.exe
   ```

5. **L'utilisateur doit:**
   - Désinstaller l'ancienne version
   - Installer la nouvelle

**✅ Avantages:**
- Clean, nouvelle installation
- Peut inclure d'autres changements

**❌ Inconvénients:**
- L'utilisateur doit désinstaller/réinstaller

---

## Méthode 4: Suppression du Cache (Dépannage)

**Quand:** Pour tester ou en dernier recours

### Sur l'ordinateur de l'utilisateur:

1. **Ouvre l'explorateur Windows**
   - Appuie sur `Windows + R`
   - Tape: `%APPDATA%\hyper-config`
   - Appuie sur Entrée

2. **Supprime TOUS les fichiers** dans ce dossier

3. **Redémarre l'application**
   - Elle rechargera les clés depuis `electron/main.cjs`

**⚠️ Problème:**
- Si l'app est déjà installée, les clés dans `main.cjs` sont celles de l'ANCIENNE version
- Tu dois combiner avec Méthode 1 ou 2

---

## 📊 Tableau Comparatif

| Méthode | Rebuild requis? | Distribution requise? | Difficulté | Recommandé pour |
|---------|----------------|----------------------|-----------|----------------|
| **1. Avant distribution** | ✅ Oui | ✅ Oui | ⭐ Facile | Avant de distribuer |
| **2. Interface de gestion** | ✅ Une fois | ❌ Non | ⭐⭐ Moyen | App déjà distribuée |
| **3. Nouvelle version** | ✅ Oui | ✅ Oui | ⭐ Facile | Mises à jour majeures |
| **4. Suppression cache** | ❌ Non | ❌ Non | ⭐⭐⭐ Compliqué | Dépannage uniquement |

---

## 🎯 Recommandation

**Pour ton cas:**

1. **Maintenant (avant distribution):** Utilise **Méthode 1**
2. **Ajoute l'interface** (Méthode 2) dans le build final
3. **Distribue le .exe** avec l'interface de gestion incluse
4. **Plus tard:** Les utilisateurs peuvent changer les clés via l'interface (sans rebuild)

---

## 🔧 Script Helper pour Changer Rapidement les Clés

Je vais créer un script pour automatiser le changement de clés:

```bash
# Utilisation:
node scripts/update-keys.cjs GOOGLE_GENERATIVE_AI_API_KEY "nouvelle_clé_ici"
```

---

## ❓ Questions Fréquentes

**Q: Pourquoi les clés sont dans `main.cjs` ET dans un stockage chiffré?**
- `main.cjs` = Clés PAR DÉFAUT (utilisées la première fois)
- Stockage chiffré = Clés ACTUELLES (peuvent être modifiées)

**Q: Si je change une clé dans `main.cjs`, ça affecte les apps déjà installées?**
- ❌ Non, les apps installées utilisent leur stockage local chiffré
- ✅ Ça affecte seulement les NOUVELLES installations

**Q: Comment savoir quelle version de l'app a quelle clé?**
- Utilise `package.json` version + notes de version
- Exemple: v0.1.0 = anciennes clés, v0.2.0 = nouvelles clés

---

## 🚀 À Faire Maintenant

1. **Décide quelle méthode utiliser** (je recommande Méthode 1 + Méthode 2)

2. **Si tu veux l'interface de gestion:**
   - Je vais l'ajouter dans ton build
   - Tu rebuild une fois
   - Ensuite, les utilisateurs peuvent changer les clés eux-mêmes

3. **Dis-moi:**
   - Est-ce que tu veux que j'ajoute l'interface de gestion maintenant?
   - Ou tu préfères juste changer les clés et rebuild?

Je suis là pour t'aider! 🎉
