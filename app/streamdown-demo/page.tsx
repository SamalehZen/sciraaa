import { StreamingMarkdownExample } from '@/components/streaming-markdown-example';

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function StreamdownDemoPage() {
  return (
    <div className="container mx-auto space-y-12 px-4 py-10">
      <section className="mx-auto max-w-3xl text-center space-y-4">
        <h1 className="text-4xl font-bold">Démonstration Streamdown</h1>
        <p className="text-lg text-muted-foreground">
          Testez le rendu Markdown en streaming : Shiki, KaTeX, Mermaid, sécurité renforcée et rendu incrémental pour vos conversations IA.
        </p>
      </section>

      <StreamingMarkdownExample />

      <section className="mx-auto max-w-5xl space-y-6">
        <h2 className="text-2xl font-semibold">Fonctionnalités principales</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard title="📝 Markdown complet" description="GitHub Flavored Markdown avec listes, tableaux et citations." />
          <FeatureCard title="🧮 LaTeX" description="Affichage des formules mathématiques grâce à KaTeX (inline et block)." />
          <FeatureCard title="🎨 Shiki" description="Coloration syntaxique avancée avec thèmes clair et sombre." />
          <FeatureCard title="📊 Mermaid" description="Diagrammes interactifs (flowchart, sequence, gantt, etc.)." />
          <FeatureCard title="🔐 Sécurité" description="Filtrage configurable des images et liens pour un rendu sûr." />
          <FeatureCard title="⚡ Streaming" description="parseIncompleteMarkdown pour afficher les réponses incrémentales." />
        </div>
      </section>
    </div>
  );
}
