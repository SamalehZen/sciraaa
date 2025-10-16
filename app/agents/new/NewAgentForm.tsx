'use client';

import { useState } from 'react';

export default function NewAgentForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, systemPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      const agentId = data.agent?.id as string;
      if (file && agentId) {
        const fd = new FormData();
        fd.set('file', file);
        fd.set('agentId', agentId);
        const up = await fetch('/api/agents/upload', { method: 'POST', body: fd });
        if (!up.ok) {
          console.warn('Upload failed');
        }
      }
      window.location.href = `/agents/${agentId}`;
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Custom Agent</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input className="w-full border rounded p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">System Prompt</label>
          <textarea className="w-full border rounded p-2 h-40" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Attach knowledge (.txt, optional)</label>
          <input type="file" accept=".txt,text/plain" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <p className="text-xs text-muted-foreground">Per-file cap 200KB; total per agent 1MB</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={saving} className="px-4 py-2 rounded bg-primary text-primary-foreground">{saving ? 'Saving…' : 'Create'}</button>
      </form>
    </div>
  );
}
