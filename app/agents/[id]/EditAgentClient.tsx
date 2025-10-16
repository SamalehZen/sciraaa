'use client';

import { useState } from 'react';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function EditAgentClient({ initialAgent, initialFiles }: { initialAgent: any; initialFiles: any[] }) {
  const [name, setName] = useState(initialAgent.name || '');
  const [description, setDescription] = useState(initialAgent.description || '');
  const [systemPrompt, setSystemPrompt] = useState(initialAgent.systemPrompt || '');
  const [files, setFiles] = useState(initialFiles || []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${initialAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, systemPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setPending(false);
    }
  }

  async function upload(f: File) {
    const fd = new FormData();
    fd.set('file', f);
    fd.set('agentId', initialAgent.id);
    const res = await fetch('/api/agents/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      setFiles((prev) => [...prev, { id: data.id, title: data.title, sizeBytes: data.sizeBytes }]);
    }
  }

  async function removeFile(id: string) {
    const res = await fetch('/api/agents/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Agent</h1>
        <button onClick={save} disabled={pending} className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm">{pending ? 'Saving…' : 'Save'}</button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input className="w-full border rounded p-2" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input className="w-full border rounded p-2" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">System Prompt</label>
          <textarea className="w-full border rounded p-2 h-56" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Knowledge Files</h2>
            <label className="text-sm underline cursor-pointer">
              <input type="file" accept=".txt,text/plain" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && upload(e.target.files[0])} />
              Add .txt
            </label>
          </div>
          <ul className="divide-y divide-border rounded-md border">
            {files.length === 0 && <li className="p-3 text-sm text-muted-foreground">No files</li>}
            {files.map((f) => (
              <li key={f.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{formatBytes(f.sizeBytes || 0)}</div>
                </div>
                <button onClick={() => removeFile(f.id)} className="text-xs underline">Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
