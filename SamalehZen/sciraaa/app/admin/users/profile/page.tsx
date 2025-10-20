"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserProfileDialog } from '@/components/admin/user-profile-dialog';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

async function fetchTopUsers() {
  const res = await fetch('/api/admin/users/ranking', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch top users');
  return res.json();
}

export default function TopProfilePage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: topUsers, isLoading } = useQuery({
    queryKey: ['top-users-ranking'],
    queryFn: fetchTopUsers,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🏆 Top Profil Utilisateurs</h1>
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🏆 Top Profil Utilisateurs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Classement Activité (Top 20)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topUsers?.ranking?.slice(0, 20) || []} layout="horizontal">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Bar dataKey="messageCount" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rang</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Messages Totaux</TableHead>
                  <TableHead>Messages 24h</TableHead>
                  <TableHead>Agent Préféré</TableHead>
                  <TableHead>Dernière Activité</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers?.details?.map((user: any, idx: number) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-bold">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.totalMessages}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.messages24h}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.favoriteAgent}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastSeen ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(user.lastSeen), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        Voir Profil Complet
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedUserId && (
        <UserProfileDialog
          userId={selectedUserId}
          open={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}
