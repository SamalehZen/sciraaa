# Guide de Débogage - Erreur "Something went wrong"

## 🔍 Diagnostic du Problème

Quand vous décoche un agent et voyez l'erreur "Something went wrong", suivez ces étapes:

### Étape 1: Ouvrir les Logs (F12)
1. Appuyez sur **F12** pour ouvrir les DevTools
2. Allez à l'onglet **Console**
3. Décochez un agent
4. Cherchez les logs avec préfixe `[AGENT-DIALOG]`

### Étape 2: Identifier l'Erreur

Vous devriez voir une séquence comme:
```
[AGENT-DIALOG] Updating agent: web -> enabled: false for userId: user-123
[AGENT-DIALOG] Request payload: {agents: {web: false}}
[AGENT-DIALOG] Response status: 200
[AGENT-DIALOG] Update successful: {...}
```

Si vous voyez une erreur, notez-la. Exemples:
- `[AGENT-DIALOG] Response status: 401` → Problème d'authentification
- `[AGENT-DIALOG] Response status: 403` → Vous n'êtes pas admin
- `[AGENT-DIALOG] Response status: 500` → Erreur serveur

## 🚨 Solutions Selon l'Erreur

### Cas 1: Status 401 (Non authentifié)
```
[AGENT-DIALOG] Response status: 401
```

**Solution**:
- Vérifiez que vous êtes connecté
- Vérifiez la session dans les cookies
- Reconnectez-vous

### Cas 2: Status 403 (Non autorisé)
```
[AGENT-DIALOG] Response status: 403
```

**Solution**:
- Vérifiez que votre compte est admin
- Vérifiez dans la BD: `SELECT role FROM "user" WHERE id='your-id'`
- Doit être `'admin'`

### Cas 3: Status 400 (Mauvaise requête)
```
[AGENT-DIALOG] Response status: 400
Error: "No agents provided"
```

**Solution**:
- Le payload est vide
- Vérifiez que le nom d'agent est correct
- Vérifiez que l'ID utilisateur n'est pas null

### Cas 4: Status 500 (Erreur serveur)
```
[AGENT-DIALOG] Response status: 500
```

**Solution**:
1. Vérifiez les logs serveur:
   ```bash
   tail -f logs/app.log | grep ADMIN-AGENTS
   ```

2. Cherchez les erreurs:
   ```
   [ADMIN-AGENTS] Database error: ...
   ```

3. Vérifiez la DB:
   ```sql
   SELECT COUNT(*) FROM user_agent_access WHERE user_id = 'user-123';
   ```

### Cas 5: Network Error (Problème de connexion)
```
TypeError: Failed to fetch
Network Error
```

**Solution**:
- Vérifiez la connexion Internet
- Vérifiez que le serveur tourne
- Vérifiez les CORS headers
- Vérifiez la console réseau (onglet Network)

## 🔧 Vérifications Supplémentaires

### Vérifier le userId

Dans la console du navigateur:
```javascript
// Voir le userId actuel
console.log(localStorage.getItem('session'))

// Ou cherchez dans les logs:
// [AGENT-DIALOG] ... for userId: USER_ID_HERE
```

### Vérifier la BD

```sql
-- Voir les agents de l'utilisateur
SELECT * FROM user_agent_access WHERE user_id = 'user-123';

-- Voir le statut de l'agent dans la table user
SELECT id, role, status FROM "user" WHERE id = 'YOUR_USER_ID';

-- Vérifier que l'agent existe
SELECT DISTINCT agent_id FROM user_agent_access;
```

### Vérifier l'Endpoint Directement

Via curl ou Postman:
```bash
# Récupérer les agents
curl -H "Cookie: session=YOUR_SESSION" \
  http://localhost:3000/api/admin/users/user-123/agents

# Mettre à jour un agent
curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{"agents": {"web": false}}' \
  http://localhost:3000/api/admin/users/user-123/agents
```

## 📊 Séquence Complète de Logs

Voici ce que vous devriez voir dans une mise à jour réussie:

**1. Dialog se charge:**
```
[AGENT-DIALOG] Fetching agents for user: user-123
[AGENT-DIALOG] API response: {success: true, data: [...]}
[AGENT-DIALOG] Building agents list
```

**2. Vous décochez:**
```
[AGENT-DIALOG] Updating agent: web -> enabled: false for userId: user-123
[AGENT-DIALOG] Request payload: {agents: {web: false}}
```

**3. Serveur traite:**
```
[ADMIN-AGENTS] Admin admin-123 updating agents for user user-456
[ADMIN-AGENTS] Database updated for 1 agents
[ADMIN-AGENTS] Triggering Pusher on channel: private-user-xyz
[ADMIN-AGENTS] Pusher event sent to user user-456
```

**4. Frontend reçoit la réponse:**
```
[AGENT-DIALOG] Response status: 200
[AGENT-DIALOG] Update successful: {success: true, message: "..."}
[AGENT-DIALOG] Fetching agents for user: user-123
[AGENT-DIALOG] API response: {success: true, data: [...]}
```

**5. Temps réel (si Pusher fonctionne):**
```
[REALTIME] Received agent update via WebSocket
[REALTIME] Agents disabled: ['web']
```

## 💡 Questions de Diagnostic

1. **Quel est le userId?**
   - Vérifiez dans les logs `[AGENT-DIALOG]`

2. **Quel est le statut HTTP?**
   - Cherchez `[AGENT-DIALOG] Response status:`

3. **Quel est le message d'erreur?**
   - Cherchez `Erreur:` dans les logs

4. **Êtes-vous admin?**
   - Allez à `/admin` - si accessible, c'est ok

5. **La BD est-elle à jour?**
   - Vérifiez `user_agent_access` table

## 🎯 Points de Vérification Prioritaires

- [ ] F12 Console ouverte
- [ ] Logs `[AGENT-DIALOG]` visibles
- [ ] Status HTTP noté
- [ ] Compte admin vérifié
- [ ] BD table `user_agent_access` existe
- [ ] Connexion au serveur OK

## 📝 Comment Reporter le Problème

Si vous ne trouvez pas la solution, fournissez:

1. **Les logs complets** (copy/paste la console):
   ```
   [AGENT-DIALOG] Fetching agents...
   [AGENT-DIALOG] Response status: XXX
   Error: ...
   ```

2. **Votre userId**:
   ```
   user-123abc...
   ```

3. **Le status HTTP** reçu

4. **Votre rôle**:
   - Vous êtes admin? OUI/NON

5. **La table existe**:
   ```sql
   SELECT COUNT(*) FROM user_agent_access;
   ```

## ✅ Vérification Finale

Après la correction, testez:

1. Ouvrez le dialog des agents
2. Décochez un agent
3. Vérifiez que vous voyez `[AGENT-DIALOG] Update successful`
4. Vérifiez que l'agent disparaît du sélecteur
5. Rechargez la page
6. Vérifiez que l'agent reste désactivé

Si tous les logs sont présents et OK, le problème est résolu! ✅
