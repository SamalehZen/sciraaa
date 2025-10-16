import { getUser } from '@/lib/auth-utils';
import { getCustomAgentById, listAgentKnowledgeFiles } from '@/lib/db/queries';
import { notFound, redirect } from 'next/navigation';
import EditAgentClient from './EditAgentClient';

export default async function EditAgentPage({ params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const agent = await getCustomAgentById({ id: params.id, userId: user.id });
  if (!agent) notFound();
  const files = await listAgentKnowledgeFiles({ agentId: agent.id, userId: user.id });
  return <EditAgentClient initialAgent={agent} initialFiles={files} />;
}
