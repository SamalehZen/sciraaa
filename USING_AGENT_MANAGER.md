# Comment Utiliser le Gestionnaire d'Accès Agents

## 🎯 Usage Simple

### Accéder au Gestionnaire

1. Connectez-vous en tant qu'**admin**
2. Allez à `/admin/users`
3. Trouvez l'utilisateur dans la liste
4. Cliquez sur cet utilisateur
5. Un dialog s'ouvre: "Gestion Accès Agents"

### Désactiver un Agent

1. Dans le dialog, trouvez l'agent (ex: "web")
2. Cliquez sur le **checkbox** pour le décocher
3. Vous verrez:
   - Toast vert: ✅ "Accès agent mis à jour"
   - L'agent se grise (désactivé)
   - La liste se met à jour

### Réactiver un Agent

1. Cliquez sur le checkbox désactivé pour le récocher
2. Toast vert: ✅ "Accès agent mis à jour"
3. L'agent redevient actif

## 🐛 Erreurs Possibles

### Erreur: "Something went wrong"

**Cause**: Le serveur a rejeté la demande

**Solution**:
1. Appuyez sur **F12** (Console)
2. Décochez l'agent
3. Cherchez les logs rouges
4. Notez le message d'erreur
5. Consultez le guide: `DEBUGGING_AGENT_ERRORS.md`

### Erreur: "Erreur lors de la mise à jour"

**Cause**: Problème lors de la mise à jour

**Solutions**:
- Vérifiez votre connexion Internet
- Vérifiez que vous êtes toujours connecté
- Réessayez en rechargeant la page

### Dialog ne s'ouvre pas

**Cause**: Problème de chargement

**Solutions**:
- Vérifiez la console (F12)
- Vérifiez votre rôle (doit être admin)
- Rechargez la page

## ⏱️ Comportement Attendu

### Timeline d'une Désactivation

```
0ms:    Vous cliquez sur le checkbox
50ms:   Envoi au serveur
150ms:  Serveur traite
200ms:  Response reçue
250ms:  Toast affiché
300ms:  UI mise à jour
500ms:  (Utilisateur voit l'agent disparaître de son interface)
```

## ✅ Checklist d'Utilisation

- [ ] Vous êtes connecté en tant qu'admin
- [ ] Vous êtes à `/admin/users`
- [ ] Vous voyez la liste des utilisateurs
- [ ] Le dialog s'ouvre quand vous cliquez
- [ ] Vous pouvez cocher/décocher les agents
- [ ] Un toast confirme chaque changement
- [ ] Les changements sont persistants (rechargement)

## 🔄 Flux Complet

```
Admin Page (/admin/users)
        ↓
Cliquez sur l'utilisateur
        ↓
Dialog "Gestion Accès Agents" s'ouvre
        ↓
Liste de tous les agents affichée
        ↓
Cochez/Décochez les agents
        ↓
Chaque changement:
  - Envoyé au serveur
  - Toast vert = Succès
  - Toast rouge = Erreur
        ↓
Utilisateur affecté:
  - Voit immédiatement l'agent disparaître
  - Chat s'arrête si l'agent actif
  - Notification affichée
```

## 📊 Agents Disponibles

Voici tous les agents qui peuvent être gérés:

| Agent | Description |
|-------|------------|
| web | Recherche web |
| x | Recherche X/Twitter |
| academic | Articles académiques |
| youtube | Recherche YouTube |
| reddit | Recherche Reddit |
| stocks | Données boursières |
| chat | Chat simple |
| extreme | Recherche extrême |
| memory | Mémoire/Supermemory |
| crypto | Crypto-monnaies |
| code | Interpréteur de code |
| connectors | Connecteurs externes |
| cyrus | Agent Cyrus |
| libeller | Agent Libeller |
| nomenclature | Nomenclature douanière |
| pdfExcel | PDF to Excel |

## 💡 Conseils

1. **Avant de désactiver un agent**:
   - Vérifiez que l'utilisateur n'en a pas besoin
   - Confirmez la demande

2. **Après avoir désactivé**:
   - L'utilisateur en sera notifié immédiatement
   - L'agent disparaît de sa liste
   - Il ne peut plus l'utiliser

3. **Pour réactiver rapidement**:
   - Ouvrez le dialog
   - Recochez l'agent
   - C'est instantané

## 🚨 Important

- ⚠️ Les changements affectent l'utilisateur **IMMÉDIATEMENT**
- ⚠️ Si l'utilisateur utilise l'agent actuellement, le chat s'arrête
- ⚠️ Les changements sont permanents jusqu'à modification
- ℹ️ Un log de tous les changements est gardé en BD

## 📞 Support

Si quelque chose ne fonctionne pas:

1. Consultez `DEBUGGING_AGENT_ERRORS.md` pour le débogage
2. Vérifiez la console (F12) pour les logs détaillés
3. Vérifiez les status HTTP
4. Consultez l'équipe technique

---

**Le système est simple et intuitif!** 
Juste cochez/décochez les agents et c'est bon. ✅
