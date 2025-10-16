import React from 'react';
import { getUser } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import NewAgentForm from './NewAgentForm';

export const dynamic = 'force-dynamic';

export default async function NewAgentPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  return <NewAgentForm />;
}
