'use client';

/**
 * Exemple d'utilisation du Pro Badge "Fix"
 * 
 * Ce composant montre comment intégrer le badge Pro stylisé
 * qui apparaît à côté du titre principal dans l'interface Hyper.
 */

// Composant Pro Badge réutilisable
const ProBadge = ({ className = '' }: { className?: string }) => (
  <span
    className={`font-baumans inline-flex items-center gap-1 rounded-lg shadow-sm !border-none !outline-0 ring-offset-1 !ring-offset-background/50 bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/25 text-foreground px-2.5 pt-0.5 !pb-2 sm:pt-1 leading-3 dark:bg-gradient-to-br dark:from-primary dark:via-secondary dark:to-primary dark:text-foreground ${className}`}
  >
    <span>Fix</span>
  </span>
);

export default function ProBadgeExample() {
  const isProUser = true; // Votre logique pour déterminer si l'utilisateur est Pro

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold mb-8">Exemples Pro Badge</h1>

      <div className="space-y-12">
        {/* Exemple 1 : Titre principal avec badge (comme dans Hyper) */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Titre principal avec badge</h2>
          
          <div className="text-center p-12 border rounded-xl bg-gradient-to-br from-background to-muted">
            <div className="inline-flex items-center gap-3">
              <h1 className="text-5xl font-light tracking-tighter">
                Hyper
              </h1>
              {isProUser && (
                <h1 className="text-2xl font-baumans leading-4 inline-block relative px-3 pt-1 pb-2.5 rounded-xl shadow-sm mt-2 bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/25 text-foreground ring-1 ring-ring/35 ring-offset-1 ring-offset-background">
                  <span className="invisible">Fix</span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    Fix
                  </span>
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Exemple 2 : Badge simple */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Badge simple</h2>
          
          <div className="flex items-center gap-3 p-6 border rounded-xl bg-card">
            <span className="text-lg">Version</span>
            <ProBadge />
          </div>
        </section>

        {/* Exemple 3 : Dans un header */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Dans un header de page</h2>
          
          <div className="p-6 border rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">Dashboard</h3>
                <ProBadge />
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                Paramètres
              </button>
            </div>
          </div>
        </section>

        {/* Exemple 4 : Dans une card de feature */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Feature cards avec badge Pro</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature basique */}
            <div className="p-6 border rounded-xl bg-card">
              <h3 className="text-lg font-semibold mb-2">Feature Basic</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fonctionnalité disponible pour tous les utilisateurs
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Gratuit
              </div>
            </div>

            {/* Feature Pro */}
            <div className="p-6 border-2 border-primary/20 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Feature Premium</h3>
                <ProBadge className="text-xs px-2 py-0.5" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Fonctionnalité réservée aux utilisateurs Pro
              </p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                Premium
              </div>
            </div>

            {/* Feature Enterprise */}
            <div className="p-6 border rounded-xl bg-card">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Feature Plus</h3>
                <ProBadge className="text-xs px-2 py-0.5" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Fonctionnalité avancée avec IA
              </p>
              <div className="flex items-center gap-2 text-xs text-purple-500">
                <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                Premium Plus
              </div>
            </div>
          </div>
        </section>

        {/* Exemple 5 : Dans un menu dropdown */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Dans un menu</h2>
          
          <div className="p-4 border rounded-xl bg-card max-w-xs">
            <div className="space-y-1">
              <button className="w-full px-3 py-2 text-left rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span>Mode Standard</span>
                </div>
              </button>
              <button className="w-full px-3 py-2 text-left rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span>Mode Avancé</span>
                  <ProBadge className="text-[10px] px-1.5 py-0" />
                </div>
              </button>
              <button className="w-full px-3 py-2 text-left rounded-lg hover:bg-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span>Mode Expert</span>
                  <ProBadge className="text-[10px] px-1.5 py-0" />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Exemple 6 : Dans une liste de fonctionnalités */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Liste de fonctionnalités</h2>
          
          <div className="p-6 border rounded-xl bg-card">
            <h3 className="text-lg font-semibold mb-4">Ce qui est inclus :</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>Recherche illimitée</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>Support 24/7</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="flex items-center gap-2">
                  Modèles AI avancés
                  <ProBadge className="text-[10px] px-1.5 py-0" />
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="flex items-center gap-2">
                  Export illimité
                  <ProBadge className="text-[10px] px-1.5 py-0" />
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="flex items-center gap-2">
                  Analyses approfondies
                  <ProBadge className="text-[10px] px-1.5 py-0" />
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Exemple 7 : Call-to-action avec badge */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Call-to-action</h2>
          
          <div className="p-8 border-2 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <h3 className="text-3xl font-bold">Passez à</h3>
              <ProBadge className="text-lg px-3 pb-2.5" />
            </div>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Débloquez toutes les fonctionnalités premium et profitez d'une expérience sans limites
            </p>
            <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Mettre à niveau maintenant
            </button>
          </div>
        </section>

        {/* Section code examples */}
        <section className="p-6 border rounded-xl bg-muted/50">
          <h2 className="text-2xl font-semibold mb-4">Code Examples</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">Pro Badge Component:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`const ProBadge = ({ className = '' }) => (
  <span
    className={\`font-baumans inline-flex items-center gap-1 
      rounded-lg shadow-sm bg-gradient-to-br 
      from-secondary/25 via-primary/20 to-accent/25 
      text-foreground px-2.5 pt-0.5 pb-2 
      \${className}\`}
  >
    <span>Fix</span>
  </span>
);`}
              </pre>
            </div>

            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">Usage avec titre:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<div className="inline-flex items-center gap-3">
  <h1 className="text-5xl font-light">Hyper</h1>
  {isProUser && <ProBadge />}
</div>`}
              </pre>
            </div>

            <div>
              <h3 className="font-mono text-sm text-muted-foreground mb-2">Usage dans une liste:</h3>
              <pre className="bg-card p-4 rounded-lg overflow-x-auto text-sm">
{`<li className="flex items-center gap-2">
  <span>Feature Premium</span>
  <ProBadge className="text-[10px] px-1.5 py-0" />
</li>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Tips section */}
        <section className="p-6 border-2 border-dashed rounded-xl bg-muted/30">
          <h2 className="text-2xl font-semibold mb-4">💡 Conseils de style</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Utilisez la police Baumans pour le texte "Fix" (téléchargez-la depuis Google Fonts)</li>
            <li>✓ Le gradient fonctionne aussi bien en mode clair qu'en mode sombre</li>
            <li>✓ Ajustez le padding (px, pt, pb) pour différentes tailles</li>
            <li>✓ Le badge utilise un positionnement absolu pour l'alignement parfait du texte</li>
            <li>✓ Combinez avec d'autres éléments pour créer des designs premium</li>
            <li>✗ N'oubliez pas d'ajouter la font Baumans à votre projet</li>
            <li>✗ Testez le badge dans différents contextes avant de l'utiliser partout</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
