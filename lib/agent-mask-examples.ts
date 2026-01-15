import { updateUserAgentMask, getVisibleAgents, getUserAgentAccess } from './db/queries';

export async function exampleMaskAgent(userId: string) {
  const allAgents = ['web', 'x', 'academic', 'youtube', 'reddit', 'stocks', 'chat', 'extreme', 
                     'memory', 'crypto', 'code', 'connectors', 'cyrus', 'libeller', 'nomenclature', 'pdfExcel'];
  
  console.log('Agent Masking Examples');
  console.log('=====================\n');
  
  console.log('1. Masquer un agent spécifique:');
  console.log(`   await updateUserAgentMask(userId, 'youtube', true);`);
  console.log(`   Résultat: L'agent YouTube sera masqué pour l'utilisateur\n`);
  
  console.log('2. Afficher un agent qui était masqué:');
  console.log(`   await updateUserAgentMask(userId, 'youtube', false);`);
  console.log(`   Résultat: L'agent YouTube sera visible à nouveau\n`);
  
  console.log('3. Récupérer tous les agents visibles:');
  console.log(`   const visibleAgents = await getVisibleAgents(userId);`);
  console.log(`   Résultat: Retourne uniquement les agents non masqués\n`);
  
  console.log('4. Récupérer tous les agents et leur statut:');
  console.log(`   const allAgents = await getUserAgentAccess(userId);`);
  console.log(`   Résultat: Retourne tous les agents avec leurs statuts (enabled, masked)\n`);
  
  console.log('5. Masquer plusieurs agents:');
  console.log(`   const agentsToMask = ['youtube', 'reddit', 'x'];`);
  console.log(`   for (const agentId of agentsToMask) {`);
  console.log(`     await updateUserAgentMask(userId, agentId, true);`);
  console.log(`   }`);
  console.log(`   Résultat: Ces trois agents seront masqués\n`);
  
  console.log('API Endpoints:');
  console.log('==============\n');
  
  console.log('Côté utilisateur:');
  console.log('PUT /api/user/agent-mask');
  console.log('Body: { agentId: "youtube", masked: true }');
  console.log('Masque ou affiche un agent pour l\'utilisateur actuel\n');
  
  console.log('Côté admin:');
  console.log('PUT /api/admin/users/[userId]/agents-mask');
  console.log('Body: { agentId: "youtube", masked: true }');
  console.log('Masque ou affiche un agent pour un utilisateur spécifique\n');
  
  console.log('Composants UI:');
  console.log('==============\n');
  
  console.log('AgentMaskDialog:');
  console.log('- Affiche une dialogue de gestion des masques');
  console.log('- Permettez aux admins de contrôler la visibilité des agents');
  console.log('- Affiche un badge "Masqué" pour les agents masqués\n');
  
  console.log('Utilisation dans l\'interface:');
  console.log('import { AgentMaskDialog } from "@/components/admin/agent-mask-dialog";');
  console.log('<AgentMaskDialog userId={userId} open={open} onOpenChange={setOpen} />\n');
}

export async function getMaskedAgentsSummary(userId: string): Promise<{ masked: string[], visible: string[] }> {
  const allAccess = await getUserAgentAccess(userId);
  
  const masked = allAccess
    .filter(agent => agent.masked === true)
    .map(agent => agent.agentId);
    
  const visible = allAccess
    .filter(agent => agent.masked === false && agent.enabled === true)
    .map(agent => agent.agentId);
    
  return { masked, visible };
}

export async function batchMaskAgents(userId: string, agentIds: string[], mask: boolean): Promise<void> {
  for (const agentId of agentIds) {
    await updateUserAgentMask(userId, agentId, mask);
  }
}

export async function resetAgentVisibility(userId: string): Promise<void> {
  const allAgents = ['web', 'x', 'academic', 'youtube', 'reddit', 'stocks', 'chat', 'extreme', 
                     'memory', 'crypto', 'code', 'connectors', 'cyrus', 'libeller', 'nomenclature', 'pdfExcel'];
  
  for (const agentId of allAgents) {
    await updateUserAgentMask(userId, agentId, false);
  }
}
