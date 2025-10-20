"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, MessageSquare, Settings } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ConversationViewerDialog } from './conversation-viewer-dialog';
import { useState } from 'react';

interface UserProfileDialogProps {
  userId: string;
  open: boolean;
  onClose: () => void;
}

export function UserProfileDialog({ userId, open, onClose }: UserProfileDialogProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/profile`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: open,
  });

  const { data: agentAccess, refetch: refetchAgents } = useQuery({
    queryKey: ['user-agents', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/agents`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    enabled: open,
  });

  const { data: userSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['user-settings', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/settings`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setCustomInstructions(data.customInstructions || '');
      return data;
    },
    enabled: open,
  });

  const handleAgentToggle = async (agentId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/agents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agents: { [agentId]: enabled } }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Accès agent mis à jour');
      refetchAgents();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSettingsUpdate = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customInstructions }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success('Paramètres mis à jour');
      refetchSettings();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const exportConversation = async (chatId: string, format: 'txt' | 'markdown') => {
    try {
      const res = await fetch(`/api/admin/chats/${chatId}/export?format=${format}`);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${chatId}.${format === 'txt' ? 'txt' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Conversation exportée');
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  if (profileLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <div className="py-12 text-center">Chargement...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Profil Complet - {profile?.user?.name || profile?.user?.email}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="statistics" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="statistics">Statistiques</TabsTrigger>
              <TabsTrigger value="agents">Agents Utilisés</TabsTrigger>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="access">Gestion Accès</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Messages Totaux</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats?.totalMessages || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Messages 24h</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{profile?.stats?.messages24h || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Coût Total (estimé)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">${profile?.stats?.totalCost?.toFixed(2) || '0.00'}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Activité dans le temps (30 derniers jours)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={profile?.charts?.activity || []}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="messages" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Agents (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={profile?.charts?.agents || []} layout="horizontal">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="agent" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="conversations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historique Conversations (50 dernières)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {profile?.conversations?.map((chat: any) => (
                      <div key={chat.id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{chat.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {chat.messageCount} messages • {new Date(chat.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => setSelectedChatId(chat.id)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Voir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportConversation(chat.id, 'txt')}>
                            <Download className="w-4 h-4 mr-2" />
                            TXT
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportConversation(chat.id, 'markdown')}>
                            <Download className="w-4 h-4 mr-2" />
                            MD
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contrôle Accès Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {agentAccess?.map((access: any) => (
                      <div key={access.agentId} className="flex items-center space-x-2 p-3 border rounded">
                        <Checkbox
                          id={`agent-${access.agentId}`}
                          checked={access.enabled}
                          onCheckedChange={(checked) => handleAgentToggle(access.agentId, !!checked)}
                        />
                        <Label htmlFor={`agent-${access.agentId}`} className="flex-1 cursor-pointer">
                          {access.agentId}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres Utilisateur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Instructions Personnalisées</Label>
                    <Textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={8}
                      placeholder="Instructions personnalisées..."
                      className="mt-2"
                    />
                  </div>

                  <Button onClick={handleSettingsUpdate}>
                    <Settings className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selectedChatId && (
        <ConversationViewerDialog chatId={selectedChatId} open={!!selectedChatId} onClose={() => setSelectedChatId(null)} />
      )}
    </>
  );
}
