'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useElectron } from '@/hooks/use-electron';
import { toast } from 'sonner';
import { Key, RefreshCw, Eye, EyeOff } from 'lucide-react';

export function ApiKeysManager() {
  const { isElectron } = useElectron();
  const [keys, setKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [currentPreview, setCurrentPreview] = useState<string>('');
  const [showValue, setShowValue] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      loadApiKeys();
    }
  }, [isElectron]);

  const loadApiKeys = async () => {
    try {
      const result = await window.electronAPI.listApiKeys();
      if (result.success) {
        setKeys(result.keys);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clés:', error);
    }
  };

  const loadKeyPreview = async (keyName: string) => {
    try {
      const result = await window.electronAPI.getApiKeyPreview(keyName);
      if (result.success) {
        setCurrentPreview(result.preview);
      } else {
        setCurrentPreview('Non disponible');
      }
    } catch (error) {
      setCurrentPreview('Erreur');
    }
  };

  const handleKeySelect = (keyName: string) => {
    setSelectedKey(keyName);
    setNewValue('');
    setShowValue(false);
    loadKeyPreview(keyName);
  };

  const handleUpdateKey = async () => {
    if (!selectedKey || !newValue.trim()) {
      toast.error('Veuillez sélectionner une clé et entrer une nouvelle valeur');
      return;
    }

    setLoading(true);
    try {
      const result = await window.electronAPI.updateApiKey(selectedKey, newValue);
      if (result.success) {
        toast.success(`Clé ${selectedKey} mise à jour avec succès`);
        toast.info('Redémarrez l\'application pour appliquer les changements', {
          duration: 5000,
        });
        setNewValue('');
        loadKeyPreview(selectedKey);
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la clé');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isElectron) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Gestion des Clés API
        </CardTitle>
        <CardDescription>
          Mettez à jour vos clés API sans rebuilder l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="key-select">Sélectionner une clé</Label>
          <select
            id="key-select"
            className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-950"
            value={selectedKey}
            onChange={(e) => handleKeySelect(e.target.value)}
          >
            <option value="">-- Choisir une clé --</option>
            {keys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {selectedKey && (
          <>
            <div>
              <Label>Valeur actuelle</Label>
              <div className="mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-mono text-sm">
                {currentPreview}
              </div>
            </div>

            <div>
              <Label htmlFor="new-value">Nouvelle valeur</Label>
              <div className="relative mt-1">
                <Input
                  id="new-value"
                  type={showValue ? 'text' : 'password'}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Entrez la nouvelle clé API"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleUpdateKey}
              disabled={loading || !newValue.trim()}
              className="w-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Mettre à jour la clé
            </Button>
          </>
        )}

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>⚠️ Important:</strong> Après avoir mis à jour une clé, vous devez redémarrer l'application
            pour que les changements prennent effet.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
