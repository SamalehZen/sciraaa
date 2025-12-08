# Guide d'intégration des composants Hyper

## 📦 Contenu du package

Ce package contient les composants réutilisables extraits du projet Sciraaa/Hyper :

### 1. **Chat Input (form-component.tsx)**
Le composant principal d'entrée de chat avec toutes ses fonctionnalités avancées :
- Input multilignes avec auto-resize
- Support d'upload de fichiers (images, PDFs)
- Sélecteur de modèles AI avec recherche intelligente
- Sélecteur de groupes de recherche
- Support des connecteurs
- Animations fluides
- États de chargement et validation

### 2. **Border Trail (border-trail.tsx)**
Animation de ligne animée qui fait le tour des quatre côtés d'un composant :
- Animation fluide et continue
- Personnalisable (couleur, taille, durée)
- Utilise Motion/Framer Motion
- Effet de bordure lumineuse

### 3. **Text Shimmer (text-shimmer.tsx)**
Effet de texte animé avec gradient qui se déplace :
- Animation de brillance sur le texte
- Support dark/light mode
- Personnalisation de la durée et spread
- Utilisé pour les états de chargement

### 4. **Pro Badge Component**
Badge "Fix" avec gradient animé :
- Badge stylisé pour les utilisateurs Pro
- Gradient personnalisé
- Intégré dans le titre principal

### 5. **Composants UI de base**
- `button.tsx` : Bouton avec variantes et tailles
- `textarea.tsx` : Zone de texte stylisée

---

## 🚀 Installation

### Étape 1 : Installer les dépendances

```bash
npm install motion framer-motion sonner class-variance-authority
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install @radix-ui/react-popover @radix-ui/react-command
npm install @radix-ui/react-drawer @radix-ui/react-switch
npm install @radix-ui/react-tooltip
npm install @hugeicons/react @hugeicons/core-free-icons
npm install @phosphor-icons/react lucide-react
npm install @vercel/analytics
npm install @ai-sdk/react
npm install @tanstack/react-query
npm install uuid
```

### Étape 2 : Copier les fichiers

Copiez tous les fichiers de ce package dans votre projet :

```
votre-projet/
├── components/
│   ├── ui/
│   │   ├── form-component.tsx      # Chat Input
│   │   ├── button.tsx              # Bouton
│   │   ├── textarea.tsx            # Textarea
│   │   └── ... (autres composants UI nécessaires)
│   └── core/
│       ├── border-trail.tsx        # Animation bordure
│       └── text-shimmer.tsx        # Animation texte
└── lib/
    └── utils.ts                    # Fonctions utilitaires
```

### Étape 3 : Configurer Tailwind CSS

Ajoutez ces configurations dans votre `tailwind.config.js` :

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      fontFamily: {
        'baumans': ['Baumans', 'cursive'],
        'be-vietnam-pro': ['Be Vietnam Pro', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}
```

### Étape 4 : Ajouter les variables CSS

Dans votre fichier CSS global (ex: `globals.css`) :

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

---

## 💡 Exemples d'utilisation

### 1. Utiliser le Chat Input (Form Component)

```tsx
import FormComponent from '@/components/ui/form-component';
import { useState } from 'react';

function ChatPage() {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);

  return (
    <FormComponent
      chatId="chat-123"
      user={currentUser}
      input={input}
      setInput={setInput}
      attachments={attachments}
      setAttachments={setAttachments}
      messages={messages}
      sendMessage={sendMessageFunction}
      status="ready"
      selectedModel="hyper-default"
      setSelectedModel={setSelectedModel}
      selectedGroup="web"
      setSelectedGroup={setSelectedGroup}
    />
  );
}
```

### 2. Utiliser Border Trail

```tsx
import { BorderTrail } from '@/components/core/border-trail';

function Card() {
  return (
    <div className="relative p-6 border rounded-lg">
      <BorderTrail 
        className="bg-gradient-to-r from-blue-500 to-purple-500"
        size={80}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <h2>Votre contenu ici</h2>
    </div>
  );
}
```

### 3. Utiliser Text Shimmer

```tsx
import { TextShimmer } from '@/components/core/text-shimmer';

function LoadingState() {
  return (
    <TextShimmer 
      className="text-lg font-medium"
      duration={2}
      spread={3}
    >
      Chargement en cours...
    </TextShimmer>
  );
}
```

### 4. Utiliser le Pro Badge (Titre avec "Fix")

```tsx
function Header() {
  const isProUser = true; // Votre logique

  return (
    <div className="inline-flex items-center gap-3">
      <h1 className="text-4xl font-light">Hyper</h1>
      {isProUser && (
        <h1 className="text-2xl font-baumans relative px-3 pt-1 pb-2.5 rounded-xl shadow-sm bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/25 text-foreground ring-1 ring-ring/35">
          <span className="invisible">Fix</span>
          <span className="absolute inset-0 flex items-center justify-center">
            Fix
          </span>
        </h1>
      )}
    </div>
  );
}
```

---

## 🎨 Personnalisation

### Border Trail

**Propriétés disponibles :**

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `className` | `string` | - | Classes CSS pour styliser la bordure |
| `size` | `number` | `60` | Taille de l'élément animé en pixels |
| `transition` | `Transition` | `{repeat: Infinity, duration: 5, ease: 'linear'}` | Configuration de l'animation |
| `delay` | `number` | - | Délai avant le démarrage de l'animation |
| `onAnimationComplete` | `() => void` | - | Callback à la fin de l'animation |
| `style` | `CSSProperties` | - | Styles CSS personnalisés |

**Exemples de personnalisation :**

```tsx
// Bordure rapide avec gradient
<BorderTrail 
  className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
  size={100}
  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
/>

// Bordure lente avec glow effect
<BorderTrail 
  className="bg-blue-500 shadow-lg shadow-blue-500/50 blur-sm"
  size={60}
  transition={{ duration: 8, repeat: Infinity }}
/>

// Bordure qui s'arrête après 3 tours
<BorderTrail 
  size={80}
  transition={{ duration: 3, repeat: 3 }}
  onAnimationComplete={() => console.log('Animation terminée!')}
/>
```

### Text Shimmer

**Propriétés disponibles :**

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `children` | `string` | - | Texte à animer |
| `as` | `ElementType` | `'p'` | Balise HTML à utiliser |
| `className` | `string` | - | Classes CSS supplémentaires |
| `duration` | `number` | `2` | Durée de l'animation en secondes |
| `spread` | `number` | `2` | Largeur du gradient (multiplicateur) |

**Exemples de personnalisation :**

```tsx
// Titre avec effet shimmer rapide
<TextShimmer 
  as="h1" 
  className="text-5xl font-bold"
  duration={1}
  spread={4}
>
  Bienvenue
</TextShimmer>

// Texte avec effet shimmer lent
<TextShimmer 
  className="text-sm text-muted-foreground"
  duration={3}
  spread={1}
>
  Traitement en cours...
</TextShimmer>
```

### Form Component (Chat Input)

Le composant est hautement personnalisable via ses props. Voici les principales :

**Props essentielles :**

```tsx
interface FormComponentProps {
  chatId: string;                          // ID unique du chat
  user: ComprehensiveUserData | null;      // Données utilisateur
  input: string;                           // Valeur de l'input
  setInput: (value: string) => void;       // Setter pour l'input
  attachments: Attachment[];               // Fichiers attachés
  setAttachments: (files: Attachment[]) => void;
  messages: ChatMessage[];                 // Historique des messages
  sendMessage: (message: any) => void;     // Fonction d'envoi
  status: 'ready' | 'streaming' | 'waiting';
  selectedModel: string;                   // Modèle AI sélectionné
  setSelectedModel: (model: string) => void;
  selectedGroup: SearchGroupId;            // Groupe de recherche
  setSelectedGroup: (group: SearchGroupId) => void;
  // ... autres props optionnelles
}
```

---

## 🔧 Adaptations nécessaires

Pour intégrer ces composants dans votre projet, vous devrez peut-être adapter :

### 1. **Imports et chemins**
Adaptez tous les imports `@/...` selon votre structure de projet.

### 2. **Fonctions utilitaires manquantes**
Le fichier `lib/utils.ts` doit contenir au minimum :

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. **Types personnalisés**
Créez les types nécessaires dans votre projet ou adaptez-les selon vos besoins.

### 4. **Contextes et hooks**
Certains composants utilisent des hooks personnalisés. Vous devrez soit :
- Les créer vous-même
- Les remplacer par vos propres hooks
- Simplifier les composants pour enlever ces dépendances

### 5. **API et actions serveur**
Les actions serveur comme `enhancePrompt`, `checkImageModeration`, etc. devront être implémentées selon votre backend.

---

## 📚 Composants supplémentaires nécessaires

Ces composants UI de base sont requis (provenant généralement de shadcn/ui) :

- `Dialog` : Pour les modals
- `Popover` : Pour les menus déroulants
- `Command` : Pour la recherche de modèles
- `Drawer` : Pour les menus mobiles
- `Switch` : Pour les toggles
- `Tooltip` : Pour les infobulles
- `Badge` : Pour les badges

Vous pouvez les installer via shadcn/ui :

```bash
npx shadcn@latest add dialog popover command drawer switch tooltip badge
```

---

## 🎯 Points d'attention

### 1. **Performance**
- Les animations utilisent Motion/Framer Motion qui sont optimisées
- Le form-component est mémorisé avec React.memo
- Les calculs lourds utilisent useMemo et useCallback

### 2. **Accessibilité**
- Tous les composants sont accessibles au clavier
- Les ARIA labels sont en place
- Support du mode sombre

### 3. **Responsive**
- Tous les composants sont responsive
- Le form-component s'adapte mobile/desktop
- Les modals deviennent des drawers sur mobile

### 4. **Browser Support**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Nécessite support de CSS Grid et Flexbox
- Motion/Framer Motion nécessite un browser moderne

---

## 🐛 Dépannage

### Problème : "Module not found"
**Solution :** Vérifiez que tous les packages npm sont installés et que les chemins d'import sont corrects.

### Problème : Styles cassés
**Solution :** Assurez-vous que :
- Tailwind CSS est configuré correctement
- Les variables CSS sont définies dans votre fichier global
- Les plugins nécessaires sont installés

### Problème : Animations ne fonctionnent pas
**Solution :** Vérifiez que :
- `motion` et `framer-motion` sont installés
- Vous utilisez un browser moderne
- Les animations ne sont pas désactivées dans les settings OS

### Problème : Form component ne fonctionne pas
**Solution :** Assurez-vous d'implémenter :
- Les hooks nécessaires (useUser, useAgentAccess, etc.)
- Les actions serveur (enhancePrompt, etc.)
- Les types et interfaces requis

---

## 📝 Licence

Ces composants sont extraits du projet open-source Sciraaa/Hyper.  
Assurez-vous de respecter la licence du projet original lors de l'utilisation.

---

## 🤝 Support

Pour toute question ou problème :
1. Consultez d'abord cette documentation
2. Vérifiez le projet source : [SamalehZen/sciraaa](https://github.com/SamalehZen/sciraaa)
3. Assurez-vous que toutes les dépendances sont installées

---

## 🎉 Prêt à utiliser !

Vous avez maintenant tous les composants nécessaires pour intégrer :
- ✅ Le chat input avec toutes ses fonctionnalités
- ✅ L'animation de bordure Border Trail
- ✅ L'effet de texte Text Shimmer
- ✅ Le badge Pro "Fix"
- ✅ Les composants UI de base

Bon développement ! 🚀
