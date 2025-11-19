'use client';

import Example from '@/components/ai-elements/reasoning-example';

export default function ReasoningExamplePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reasoning UI Demo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page illustre le composant Reasoning : la section s’ouvre automatiquement au début du streaming
          simulé et se referme une fois le flux terminé. Survolez le composant pour tester l’animation et le
          déclenchement des actions.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <Example />
      </div>
    </div>
  );
}
