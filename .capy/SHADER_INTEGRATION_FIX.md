# Fix : Intégration du Shader Three.js - Résolution du problème ReactCurrentBatchConfig

## Problème initial
```
TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')
```

Cette erreur classique survient quand React Three Fiber tente de faire du SSR (Server-Side Rendering) avec React 19, ce qui est incompatible.

## Solution implémentée

### Avant ❌
```typescript
export const DotScreenShader = () => {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  )
}
```

### Après ✅
```typescript
const DotScreenShaderComponent = () => {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  )
}

export const DotScreenShader = dynamic(() => Promise.resolve(DotScreenShaderComponent), {
  ssr: false,
  loading: () => null
})
```

## Pourquoi c'est important

1. **Three.js ne supporte pas SSR** - Le rendu côté serveur est impossible pour WebGL
2. **React 19 + React Three Fiber** - Conflit interne avec le système de concurrence
3. **Solution Next.js standard** - Utiliser `dynamic` avec `ssr: false` est le pattern recommandé

## Vérification

Après la correction :
- ✅ L'erreur `ReactCurrentBatchConfig` n'apparaît plus
- ✅ Le build continue sans erreurs Three.js
- ✅ Le Canvas se charge correctement côté client
- ✅ Tous les effets du shader (animation, mouse trail) fonctionnent

## Pour tester en local

```bash
# Ajouter les variables d'environnement manquantes
cp .env.example .env.local

# Puis build
pnpm run build

# Ou dev mode
pnpm run dev
```

## Notes supplémentaires

- Ce pattern fonctionne également avec d'autres libraries 3D (Babylon.js, Playcanvas, etc.)
- Le loading component `() => null` peut être remplacé par un skeleton si désiré
- Pour plus de performance, vous pouvez ajouter `preload={true}` pour charger le composant plus tôt
