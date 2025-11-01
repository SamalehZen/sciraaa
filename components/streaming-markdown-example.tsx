'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { StreamdownRenderer } from '@/components/streamdown-renderer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { mermaidConfigDark, mermaidConfigLight } from '@/lib/mermaid-config';
import { shikiThemes } from '@/lib/shiki-config';

const STREAM_INTERVAL_MS = 50;

export function StreamingMarkdownExample() {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fullContent = useMemo(() => {
    const lines = [
      '# Réponse IA en streaming',
      '',
      'Bienvenue dans la démonstration **Streamdown**.',
      '',
      '## 1. Mise en forme',
      '',
      "Le **gras**, l'*italique* et le ~~barré~~ fonctionnent sans souci.",
      '',
      '## 2. Listes',
      '',
      '- [x] Fonctionnalité déjà terminée',
      '- [ ] Fonctionnalité en cours',
      '- [ ] Fonctionnalité à venir',
      '',
      '1. Étape A',
      '2. Étape B',
      '3. Étape C',
      '',
      '## 3. Code (Shiki)',
      '',
      '```typescript',
      'interface User {',
      '  id: number;',
      '  name: string;',
      '  email: string;',
      '}',
      '',
      'async function fetchUser(id: number): Promise<User> {',
      "  const res = await fetch(`/api/users/${id}`);",
      '  if (!res.ok) {',
      "    throw new Error('Failed to fetch user');",
      '  }',
      '  return res.json();',
      '}',
      '',
      'const user = await fetchUser(42);',
      'console.log(user.name);',
      '```',
      '',
      '```python',
      'def fibonacci(n: int) -> int:',
      '    if n <= 1:',
      '        return n',
      '    return fibonacci(n - 1) + fibonacci(n - 2)',
      '',
      'for i in range(10):',
      '    print(f"fib({i}) = {fibonacci(i)}")',
      '```',
      '',
      '## 4. Mathématiques',
      '',
      'Formule en ligne : $e^{i\\pi} + 1 = 0$.',
      '',
      'Formule en bloc :',
      '',
      '$$',
      'i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\',
      '  \left[-\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t)\right]\\Psi(\\mathbf{r},t)',
      '$$',
      '',
      '## 5. Tableau (GFM)',
      '',
      '| Nom | Rôle | Statut |',
      '| --- | --- | --- |',
      '| Alice | Ingénieure | ✅ |',
      '| Bob | Designer | ✅ |',
      '| Charlie | PM | 🔄 |',
      '',
      '## 6. Diagramme Mermaid',
      '',
      '```mermaid',
      'graph TD',
      '  A[Utilisateur] -->|Saisit| B[Interface]',
      '  B -->|Envoie| C[Backend]',
      '  C -->|Stream| D[Streamdown]',
      '  D -->|Affiche| A',
      '```',
      '',
      '## 7. Liens et images',
      '',
      'Visitez [Streamdown](https://streamdown.ai) pour plus d\'informations.',
      '',
      '![Logo Streamdown](https://streamdown.ai/og-image.png)',
      '',
      '---',
      '',
      '**Fin du streaming** ✨',
    ];

    return lines.join('\n');
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    clearTimer();
    setIsStreaming(false);
  }, [clearTimer]);

  const startStreaming = useCallback(() => {
    clearTimer();
    setContent('');
    setIsStreaming(true);

    let index = 0;
    timerRef.current = setInterval(() => {
      const chunkSize = Math.floor(Math.random() * 40) + 10;
      const nextIndex = Math.min(index + chunkSize, fullContent.length);
      const chunk = fullContent.slice(index, nextIndex);
      index = nextIndex;

      setContent((prev) => prev + chunk);

      if (index >= fullContent.length) {
        stopStreaming();
      }
    }, STREAM_INTERVAL_MS);
  }, [clearTimer, fullContent, stopStreaming]);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer],
  );

  return (
    <Card className="max-w-4xl mx-auto space-y-4 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Démonstration de streaming</h2>
          <p className="text-sm text-muted-foreground">
            Simule une réponse IA en streaming avec Markdown, code, math et Mermaid.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={startStreaming} disabled={isStreaming}>
            {isStreaming ? 'Streaming en cours…' : 'Relancer le streaming'}
          </Button>
          {isStreaming && (
            <Button variant="outline" onClick={stopStreaming}>
              Arrêter
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background/60 p-4">
        <StreamdownRenderer
          content={content}
          isStreaming={isStreaming}
          shikiTheme={{ light: shikiThemes[0], dark: shikiThemes[1] }}
          mermaidConfig={{ light: mermaidConfigLight, dark: mermaidConfigDark }}
        />
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Caractères streamés : {content.length} / {fullContent.length}</p>
        <p>Statut : {isStreaming ? '🟢 En cours' : '⚪ Inactif'}</p>
      </div>
    </Card>
  );
}
