'use client';

import { BorderTrail } from '../components/core/border-trail';

/**
 * Exemple d'utilisation du composant Border Trail
 * 
 * Cette animation crée une bordure lumineuse qui fait le tour
 * de n'importe quel élément de manière fluide et continue.
 */
export default function BorderTrailExample() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Exemples Border Trail</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Exemple 1 : Bordure simple */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-blue-500"
            size={60}
          />
          <h3 className="text-xl font-semibold mb-2">Bordure Simple</h3>
          <p className="text-muted-foreground">
            Une bordure bleue classique qui fait le tour du composant.
          </p>
        </div>

        {/* Exemple 2 : Bordure avec gradient */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
            size={80}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <h3 className="text-xl font-semibold mb-2">Bordure Gradient</h3>
          <p className="text-muted-foreground">
            Un gradient coloré qui se déplace autour de la carte.
          </p>
        </div>

        {/* Exemple 3 : Bordure rapide */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-green-500"
            size={40}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <h3 className="text-xl font-semibold mb-2">Bordure Rapide</h3>
          <p className="text-muted-foreground">
            Une animation plus rapide avec un élément plus petit.
          </p>
        </div>

        {/* Exemple 4 : Bordure avec glow */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-purple-500 shadow-2xl shadow-purple-500/50 blur-sm"
            size={100}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <h3 className="text-xl font-semibold mb-2">Bordure Glow</h3>
          <p className="text-muted-foreground">
            Un effet de lueur qui donne un aspect néon à la bordure.
          </p>
        </div>

        {/* Exemple 5 : Bordure personnalisée */}
        <div className="relative p-6 border rounded-2xl bg-gradient-to-br from-background to-muted">
          <BorderTrail 
            className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
            size={70}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
          />
          <h3 className="text-xl font-semibold mb-2">Bordure Custom</h3>
          <p className="text-muted-foreground">
            Combinaison d'un fond dégradé avec une bordure animée.
          </p>
        </div>

        {/* Exemple 6 : Multiple Border Trails */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-cyan-500"
            size={50}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <BorderTrail 
            className="bg-yellow-500"
            size={50}
            delay={1.5}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <h3 className="text-xl font-semibold mb-2">Double Bordure</h3>
          <p className="text-muted-foreground">
            Deux bordures qui se suivent avec un délai.
          </p>
        </div>

        {/* Exemple 7 : Card avec contenu riche */}
        <div className="relative p-8 border-2 rounded-2xl bg-gradient-to-br from-card to-card/50">
          <BorderTrail 
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
            size={90}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Feature Card</h3>
                <p className="text-sm text-muted-foreground">Premium feature</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Utilisez Border Trail pour mettre en valeur des éléments importants
              ou des fonctionnalités premium dans votre application.
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              En savoir plus
            </button>
          </div>
        </div>

        {/* Exemple 8 : Loading state */}
        <div className="relative p-6 border rounded-xl bg-card">
          <BorderTrail 
            className="bg-gradient-to-r from-gray-400 to-gray-600"
            size={60}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h3 className="text-xl font-semibold mb-2">État de chargement</h3>
          <p className="text-muted-foreground">
            Parfait pour indiquer qu'un processus est en cours.
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-2 bg-muted rounded animate-pulse" />
            <div className="h-2 bg-muted rounded animate-pulse w-3/4" />
          </div>
        </div>
      </div>

      {/* Section code examples */}
      <div className="mt-12 p-6 border rounded-xl bg-muted/50">
        <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-mono text-sm text-muted-foreground mb-2">Basic Usage:</h3>
            <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<div className="relative p-6 border rounded-xl">
  <BorderTrail className="bg-blue-500" size={60} />
  <YourContent />
</div>`}
            </pre>
          </div>

          <div>
            <h3 className="font-mono text-sm text-muted-foreground mb-2">With Gradient:</h3>
            <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<BorderTrail 
  className="bg-gradient-to-r from-pink-500 to-purple-500"
  size={80}
  transition={{ duration: 3, repeat: Infinity }}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-mono text-sm text-muted-foreground mb-2">Custom Animation:</h3>
            <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<BorderTrail 
  className="bg-green-500"
  size={50}
  transition={{ 
    duration: 2, 
    repeat: 5, 
    ease: 'easeInOut' 
  }}
  onAnimationComplete={() => console.log('Done!')}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
