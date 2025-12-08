'use client';

import { TextShimmer } from '../components/core/text-shimmer';

/**
 * Exemple d'utilisation du composant Text Shimmer
 * 
 * Cette animation crée un effet de brillance qui se déplace sur le texte,
 * parfait pour les états de chargement ou pour attirer l'attention.
 */
export default function TextShimmerExample() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Exemples Text Shimmer</h1>

      <div className="space-y-12">
        {/* Section 1 : Titres */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Titres avec effet shimmer</h2>
          
          <TextShimmer 
            as="h1" 
            className="text-6xl font-bold"
            duration={2}
            spread={3}
          >
            Titre Principal
          </TextShimmer>

          <TextShimmer 
            as="h2" 
            className="text-4xl font-semibold"
            duration={2.5}
            spread={2}
          >
            Sous-titre Important
          </TextShimmer>

          <TextShimmer 
            as="h3" 
            className="text-2xl font-medium"
            duration={3}
            spread={1.5}
          >
            Section Header
          </TextShimmer>
        </section>

        {/* Section 2 : États de chargement */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">États de chargement</h2>
          
          <div className="p-6 border rounded-xl bg-card">
            <TextShimmer 
              className="text-lg font-medium mb-2"
              duration={1.5}
              spread={2}
            >
              Chargement en cours...
            </TextShimmer>
            <p className="text-sm text-muted-foreground">
              Utilisez cet effet pour indiquer qu'un processus est en cours
            </p>
          </div>

          <div className="p-6 border rounded-xl bg-card">
            <TextShimmer 
              className="text-base"
              duration={2}
              spread={1.5}
            >
              Traitement de votre demande...
            </TextShimmer>
          </div>

          <div className="p-6 border rounded-xl bg-card">
            <TextShimmer 
              className="text-sm"
              duration={1}
              spread={1}
            >
              Connexion au serveur...
            </TextShimmer>
          </div>
        </section>

        {/* Section 3 : Textes d'attente */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Messages d'attente</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border rounded-xl bg-card text-center">
              <div className="mb-4 text-4xl">⏳</div>
              <TextShimmer 
                className="text-lg font-medium"
                duration={2}
              >
                Préparation de l'analyse...
              </TextShimmer>
            </div>

            <div className="p-6 border rounded-xl bg-card text-center">
              <div className="mb-4 text-4xl">🔄</div>
              <TextShimmer 
                className="text-lg font-medium"
                duration={2.5}
              >
                Synchronisation en cours...
              </TextShimmer>
            </div>

            <div className="p-6 border rounded-xl bg-card text-center">
              <div className="mb-4 text-4xl">📊</div>
              <TextShimmer 
                className="text-lg font-medium"
                duration={1.8}
              >
                Génération du rapport...
              </TextShimmer>
            </div>

            <div className="p-6 border rounded-xl bg-card text-center">
              <div className="mb-4 text-4xl">🚀</div>
              <TextShimmer 
                className="text-lg font-medium"
                duration={2.2}
              >
                Déploiement en cours...
              </TextShimmer>
            </div>
          </div>
        </section>

        {/* Section 4 : Annonces et Call-to-Action */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Annonces & CTAs</h2>
          
          <div className="p-8 border-2 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 text-center">
            <TextShimmer 
              as="h2"
              className="text-5xl font-bold mb-4"
              duration={3}
              spread={4}
            >
              Nouvelle Fonctionnalité
            </TextShimmer>
            <p className="text-muted-foreground mb-6">
              Découvrez nos dernières innovations
            </p>
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              En savoir plus
            </button>
          </div>
        </section>

        {/* Section 5 : Variations de vitesse */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Variations de vitesse</h2>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Très rapide (1s)</p>
              <TextShimmer duration={1} spread={2}>
                Animation très rapide pour attirer l'attention immédiate
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Rapide (2s)</p>
              <TextShimmer duration={2} spread={2}>
                Animation rapide pour les états de chargement courts
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Moyen (3s)</p>
              <TextShimmer duration={3} spread={2}>
                Animation moyenne pour un effet équilibré
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Lent (4s)</p>
              <TextShimmer duration={4} spread={2}>
                Animation lente pour un effet plus subtil et relaxant
              </TextShimmer>
            </div>
          </div>
        </section>

        {/* Section 6 : Variations de spread */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold mb-6">Variations de spread (largeur du gradient)</h2>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Spread: 0.5 (très étroit)</p>
              <TextShimmer duration={2} spread={0.5}>
                Gradient très concentré et précis
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Spread: 1 (étroit)</p>
              <TextShimmer duration={2} spread={1}>
                Gradient étroit pour un effet subtil
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Spread: 2 (normal)</p>
              <TextShimmer duration={2} spread={2}>
                Gradient standard recommandé pour la plupart des cas
              </TextShimmer>
            </div>

            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-2">Spread: 4 (large)</p>
              <TextShimmer duration={2} spread={4}>
                Gradient large pour un effet plus doux et étalé
              </TextShimmer>
            </div>
          </div>
        </section>

        {/* Section code examples */}
        <section className="p-6 border rounded-xl bg-muted/50">
          <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">Basic Usage:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<TextShimmer>
  Chargement en cours...
</TextShimmer>`}
              </pre>
            </div>

            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">As Title:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<TextShimmer 
  as="h1" 
  className="text-4xl font-bold"
  duration={2}
  spread={3}
>
  Mon Titre
</TextShimmer>`}
              </pre>
            </div>

            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">Custom Animation:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<TextShimmer 
  className="text-lg"
  duration={1.5}
  spread={1}
>
  Traitement rapide...
</TextShimmer>`}
              </pre>
            </div>

            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">In Loading Card:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<div className="p-6 border rounded-xl">
  <TextShimmer 
    className="text-lg font-medium"
    duration={2}
  >
    Votre contenu se charge...
  </TextShimmer>
  <p className="text-sm text-muted-foreground mt-2">
    Veuillez patienter
  </p>
</div>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Tips section */}
        <section className="p-6 border-2 border-dashed rounded-xl bg-muted/30">
          <h2 className="text-2xl font-semibold mb-4">💡 Conseils d'utilisation</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Utilisez des durées courtes (1-2s) pour les états de chargement rapides</li>
            <li>✓ Utilisez des durées longues (3-4s) pour les effets décoratifs</li>
            <li>✓ Un spread de 2 est recommandé pour la plupart des cas</li>
            <li>✓ Combinez avec d'autres animations pour un effet plus riche</li>
            <li>✓ Testez en mode clair et sombre pour vérifier la lisibilité</li>
            <li>✗ N'abusez pas de l'effet - trop d'animations peuvent distraire</li>
            <li>✗ Évitez sur de longs paragraphes - privilégiez les titres courts</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
