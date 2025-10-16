import Link from 'next/link';
import { getUser } from '@/lib/auth-utils';
import { listCustomAgentsForUser } from '@/lib/db/queries';

export default async function AgentsPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-semibold">Custom Agents</h2>
        <p className="text-sm text-muted-foreground mt-2">Please sign in to manage your agents.</p>
      </div>
    );
  }
  const agents = await listCustomAgentsForUser({ userId: user.id });
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Custom Agents</h1>
        <Link className="text-sm underline" href="/agents/new">Create new</Link>
      </div>
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agents yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border">
          {agents.map((a) => (
            <li key={a.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">Updated {new Date(a.updatedAt as any).toLocaleString()}</div>
              </div>
              <Link className="text-sm underline" href={`/agents/${a.id}`}>Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
