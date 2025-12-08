# Hyper Components Export

Package de composants réutilisables extraits du projet [Sciraaa/Hyper](https://github.com/SamalehZen/sciraaa).

## 📦 Contenu

Ce package contient les composants suivants :

### Composants principaux
- **Chat Input (form-component)** - Composant d'entrée de chat complet avec upload, sélection de modèles, etc.
- **Border Trail** - Animation de bordure qui fait le tour d'un élément
- **Text Shimmer** - Effet de texte avec gradient animé
- **Pro Badge** - Badge "Fix" stylisé pour les fonctionnalités premium

### Composants UI de base
- Button - Bouton avec variantes
- Textarea - Zone de texte stylisée

### Utilitaires
- lib/utils.ts - Fonctions utilitaires (cn, formatters, etc.)

## 🚀 Installation rapide

1. Installez les dépendances :
```bash
npm install
```

2. Copiez les composants dans votre projet

3. Configurez Tailwind CSS (voir PROMPT.md pour les détails)

4. Utilisez les composants !

## 📖 Documentation complète

Consultez **PROMPT.md** pour :
- Guide d'installation détaillé
- Exemples de code
- Personnalisation des composants
- Dépannage

## 📁 Structure

```
components-export/
├── components/
│   ├── ui/
│   │   ├── form-component.tsx    # Chat Input
│   │   ├── button.tsx            # Button
│   │   └── textarea.tsx          # Textarea
│   └── core/
│       ├── border-trail.tsx      # Border Trail Animation
│       └── text-shimmer.tsx      # Text Shimmer Animation
├── lib/
│   └── utils.ts                  # Utility functions
├── examples/
│   ├── chat-input-example.tsx    # Exemple Chat Input
│   ├── border-trail-example.tsx  # Exemples Border Trail
│   ├── text-shimmer-example.tsx  # Exemples Text Shimmer
│   └── pro-badge-example.tsx     # Exemples Pro Badge
├── PROMPT.md                     # Documentation complète
├── package.json                  # Dépendances
└── README.md                     # Ce fichier
```

## 🎯 Usage rapide

### Border Trail
```tsx
import { BorderTrail } from './components/core/border-trail';

<div className="relative p-6 border rounded-xl">
  <BorderTrail className="bg-blue-500" size={60} />
  <YourContent />
</div>
```

### Text Shimmer
```tsx
import { TextShimmer } from './components/core/text-shimmer';

<TextShimmer className="text-lg font-medium">
  Chargement en cours...
</TextShimmer>
```

### Pro Badge
```tsx
const ProBadge = () => (
  <span className="font-baumans inline-flex items-center gap-1 rounded-lg shadow-sm bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/25 text-foreground px-2.5 pt-0.5 pb-2">
    <span>Fix</span>
  </span>
);
```

## 🔧 Technologies utilisées

- React 19
- TypeScript
- Tailwind CSS
- Motion/Framer Motion
- Radix UI
- Lucide Icons
- shadcn/ui patterns

## 📝 Licence

Ces composants sont extraits du projet open-source Sciraaa/Hyper.  
Respectez la licence MIT du projet original.

## 🤝 Support

Pour toute question :
1. Consultez d'abord PROMPT.md
2. Référez-vous au projet source : https://github.com/SamalehZen/sciraaa
3. Vérifiez que toutes les dépendances sont installées

## ⚡ Quick Start

```bash
# 1. Installer les dépendances
npm install

# 2. Copier les composants dans votre projet
cp -r components/* votre-projet/components/
cp -r lib/* votre-projet/lib/

# 3. Voir les exemples
# Copiez les fichiers dans examples/ pour voir des démos complètes
```

## 🎨 Exemples inclus

Le dossier `examples/` contient des exemples complets et interactifs pour chaque composant :

- **border-trail-example.tsx** - 8 variations de Border Trail avec code
- **text-shimmer-example.tsx** - Multiples exemples de Text Shimmer
- **pro-badge-example.tsx** - 7 façons d'utiliser le Pro Badge
- **chat-input-example.tsx** - Intégration du Chat Input

## 🌟 Features

✅ Composants React modernes et performants  
✅ Support TypeScript complet  
✅ Animations fluides avec Motion  
✅ Dark mode ready  
✅ Responsive design  
✅ Accessible (ARIA)  
✅ Personnalisable via Tailwind  
✅ Exemples de code inclus  

---

**Bon développement ! 🚀**
