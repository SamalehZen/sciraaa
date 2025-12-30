import { ApiKeysManager } from '@/components/electron';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Gestion des Clés API - Hyper Desktop',
  description: 'Gérez vos clés API',
};

export default function ApiKeysPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <Link 
            href="/settings" 
            className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux paramètres
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Clés API</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Mettez à jour vos clés API sans rebuilder l'application
          </p>
        </div>

        <ApiKeysManager />
      </div>
    </div>
  );
}
