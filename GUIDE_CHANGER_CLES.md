# 🔑 Guide Complet: Changer les Clés API

## 📌 Résumé Rapide

**3 façons de changer les clés:**

1. **AVANT de distribuer** → Modifier `electron/main.cjs` et rebuild
2. **APRÈS distribution** → Utiliser l'interface de gestion (dans l'app)
3. **Script rapide** → Utiliser `pnpm electron:update-key`

---

## 🎯 Méthode 1: Modifier avant Distribution (Le plus simple)

**✅ Recommandé si:** Tu n'as pas encore distribué l'app

### Étape par étape:

**1. Ouvre le terminal**
```bash
cd C:\chemin\vers\sciraaa
```

**2. Liste les clés actuelles** (optionnel)
```bash
pnpm electron:list-keys
```

Tu verras:
```
📋 Clés API configurées:
┌────────────────────────────────────┬──────────────────────┐
│ GOOGLE_GENERATIVE_AI_API_KEY      │ AIzaSyBxu1...hoH4    │
│ GEMINI_API_KEY                     │ AIzaSyDGRM...wPtI    │
│ EXA_API_KEY                        │ 41167bf3-e...6032    │
...
```

**3. Modifie une clé avec le script**
```bash
pnpm electron:update-key GOOGLE_GENERATIVE_AI_API_KEY "ta_nouvelle_cle_ici"
```

Résultat:
```
✅ Clé "GOOGLE_GENERATIVE_AI_API_KEY" mise à jour avec succès!
📝 Nouvelle valeur: ta_nouvell...e_ici
⚠️  N'oubliez pas de rebuild l'application:
   pnpm electron:build-win
```

**4. Rebuild l'application**
```bash
pnpm electron:build-win
```

**5. Distribue le nouveau .exe**
```
dist-electron/Hyper Desktop-Setup-0.1.0.exe
```

### Alternative: Modifier manuellement

**Ouvre `electron/main.cjs` (ligne 27)**
```javascript
const DEFAULT_API_KEYS = {
  GOOGLE_GENERATIVE_AI_API_KEY: 'AIzaSyBxu15F8LevYrOlTDuzYZL6HhlkZr4hoH4',  // ← Change ici
  GEMINI_API_KEY: 'AIzaSyDGRMh1j5gNtm5FiEvnZzBRzLA0bDUwPtI',
  // ... autres clés
};
```

**Change la valeur:**
```javascript
GOOGLE_GENERATIVE_AI_API_KEY: 'NOUVELLE_CLE_ICI',
```

**Sauvegarde et rebuild:**
```bash
pnpm electron:build-win
```

---

## 🎯 Méthode 2: Interface de Gestion (Pour apps déjà distribuées)

**✅ Recommandé si:** L'app est déjà installée chez les utilisateurs

### J'ai créé une interface graphique pour changer les clés!

**Dans l'application installée:**

1. **Lance l'application Hyper Desktop**

2. **Va dans le menu:**
   ```
   Menu > Navigation > Gérer les clés API
   ```
   Ou utilise le raccourci: **Ctrl + K**

3. **Tu verras l'interface:**

   ```
   ┌────────────────────────────────────────┐
   │   Gestion des Clés API                │
   ├────────────────────────────────────────┤
   │                                        │
   │ Sélectionner une clé:                 │
   │ [Dropdown avec toutes les clés]       │
   │                                        │
   │ Valeur actuelle:                      │
   │ AIzaSyBx...hoH4                       │
   │                                        │
   │ Nouvelle valeur:                      │
   │ [Champ de texte]                      │
   │ [👁️ Afficher/Masquer]                │
   │                                        │
   │ [Mettre à jour la clé]                │
   │                                        │
   │ ⚠️ Redémarrez l'app après la mise     │
   │    à jour                              │
   └────────────────────────────────────────┘
   ```

4. **Étapes:**
   - Sélectionne la clé à modifier (ex: `GOOGLE_GENERATIVE_AI_API_KEY`)
   - Tu vois l'aperçu de la valeur actuelle (masquée: `AIza...hoH4`)
   - Entre la nouvelle clé dans le champ
   - Clique sur "Mettre à jour la clé"
   - ✅ Message de confirmation
   - **Ferme et redémarre l'app**

**✅ Avantages:**
- Pas besoin de rebuilder
- L'utilisateur peut le faire lui-même
- Les clés restent chiffrées (stockées de façon sécurisée)

**⚠️ Note importante:**
- Cette interface est **déjà incluse** dans ton build
- Elle fonctionne pour toutes les apps installées
- Les changements sont stockés localement sur chaque PC

---

## 🎯 Méthode 3: Script en Ligne de Commande

**✅ Recommandé pour:** Les développeurs qui aiment les scripts

### Commandes disponibles:

**A. Lister toutes les clés**
```bash
pnpm electron:list-keys
```

**B. Modifier une clé**
```bash
pnpm electron:update-key NOM_DE_LA_CLE "nouvelle_valeur"
```

**Exemples:**
```bash
# Changer la clé Gemini
pnpm electron:update-key GOOGLE_GENERATIVE_AI_API_KEY "AIzaSy_nouvelle_cle"

# Changer l'URL de la base de données
pnpm electron:update-key DATABASE_URL "postgresql://..."

# Changer la clé Serper
pnpm electron:update-key SERPER_API_KEY "nouvelle_serper_key"
```

**C. Rebuild après modification**
```bash
pnpm electron:build-win
```

---

## 📊 Tableau Comparatif des Méthodes

| Méthode | Rebuild? | Distribution? | Difficulté | Meilleur pour |
|---------|----------|--------------|-----------|--------------|
| **1. Script/Manuel** | ✅ Oui | ✅ Oui | ⭐ Facile | Avant de distribuer |
| **2. Interface graphique** | ❌ Non | ❌ Non | ⭐ Très facile | Apps déjà installées |
| **3. Script CLI** | ✅ Oui | ✅ Oui | ⭐⭐ Moyen | Développeurs |

---

## 🔒 Sécurité des Clés

**Comment les clés sont stockées:**

```
┌─────────────────────────────────────────┐
│ electron/main.cjs                       │
│ - Clés PAR DÉFAUT (première install)   │
│ - Visibles dans le code                │
│ - Utilisées si pas de stockage local   │
└─────────────────┬───────────────────────┘
                  │
                  ▼ (Au premier lancement)
┌─────────────────────────────────────────┐
│ %APPDATA%\hyper-config\                 │
│ - Clés CHIFFRÉES (safeStorage)         │
│ - Utilisées pour toutes les exécutions │
│ - Peuvent être modifiées par interface │
└─────────────────────────────────────────┘
```

**Quand tu changes une clé via l'interface:**
- Elle est chiffrée avec DPAPI Windows
- Stockée dans `%APPDATA%\hyper-config\`
- Seul l'utilisateur actuel peut la déchiffrer
- Pas besoin de rebuilder l'app

---

## 🎬 Scénarios Pratiques

### Scénario 1: Tu veux tester avec de nouvelles clés

**Avant de distribuer:**
```bash
pnpm electron:update-key GOOGLE_GENERATIVE_AI_API_KEY "test_key"
pnpm electron:build-win
# Teste le .exe
```

### Scénario 2: Un utilisateur a une clé qui a expiré

**L'utilisateur:**
1. Ouvre l'app
2. Menu > Navigation > Gérer les clés API (ou **Ctrl+K**)
3. Sélectionne la clé expirée
4. Entre la nouvelle clé
5. Clique "Mettre à jour"
6. Redémarre l'app

**Pas besoin de te contacter!** 🎉

### Scénario 3: Tu veux distribuer une nouvelle version avec de nouvelles clés

```bash
# 1. Change la version
# Dans package.json: "version": "0.2.0"

# 2. Change les clés
pnpm electron:update-key GOOGLE_GENERATIVE_AI_API_KEY "new_key_v2"

# 3. Rebuild
pnpm electron:build-win

# 4. Distribue
# dist-electron/Hyper Desktop-Setup-0.2.0.exe
```

---

## 🆘 Dépannage

### Problème: "Clé non trouvée"

**Solution:**
```bash
# Liste toutes les clés disponibles
pnpm electron:list-keys

# Copie le nom exact de la clé
pnpm electron:update-key NOM_EXACT_ICI "nouvelle_valeur"
```

### Problème: L'interface de gestion ne s'affiche pas

**Solution:**
1. Vérifie que tu es en mode Electron (pas navigateur web)
2. Essaie le raccourci **Ctrl + K**
3. Ou va dans Menu > Navigation > Gérer les clés API

### Problème: Les changements ne prennent pas effet

**Solution:**
1. **Ferme complètement** l'application (pas juste la fenêtre)
2. Dans le gestionnaire des tâches, vérifie qu'il n'y a pas de processus "Hyper Desktop" en cours
3. Relance l'application

---

## 🚀 Commandes Récapitulatives

```bash
# 1. Lister les clés
pnpm electron:list-keys

# 2. Modifier une clé
pnpm electron:update-key NOM_CLE "nouvelle_valeur"

# 3. Rebuild
pnpm electron:build-win

# 4. Ou utiliser l'interface graphique (Ctrl+K dans l'app)
```

---

## ❓ Questions?

**Q: Si je change une clé dans `main.cjs`, ça affecte les apps déjà installées?**
- ❌ Non, elles utilisent leur stockage local
- ✅ Ça affecte seulement les NOUVELLES installations

**Q: Puis-je changer plusieurs clés en même temps?**
- ✅ Via script: Exécute la commande plusieurs fois
- ✅ Via interface: Change-les une par une
- ❌ Redémarre l'app qu'UNE FOIS après tous les changements

**Q: Les clés sont-elles visibles dans le code?**
- ✅ Oui dans `main.cjs` (clés par défaut)
- ❌ Non dans le stockage local (chiffrées)

**Q: Comment réinitialiser toutes les clés?**
- Supprime le dossier `%APPDATA%\hyper-config\`
- Relance l'app (elle rechargera les clés par défaut)

---

## 🎁 Bonus: Automatisation

**Si tu changes souvent les clés, crée un fichier `.env.local`:**

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=ma_cle
GEMINI_API_KEY=ma_cle2
```

**Puis dans `electron/main.cjs`, ajoute:**
```javascript
require('dotenv').config({ path: '.env.local' });
```

**Comme ça, les clés sont lues depuis `.env.local` en développement!**

---

✅ Maintenant tu as toutes les méthodes pour changer les clés API! 🎉
