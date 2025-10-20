"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ConversationViewerDialogProps {
  chatId: string;
  open: boolean;
  onClose: () => void;
}

export function ConversationViewerDialog({ chatId, open, onClose }: ConversationViewerDialogProps) {
  const { data: conversation, isLoading } = useQuery({
    queryKey: ['admin-conversation', chatId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/chats/${chatId}`);
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? 'Chargement...' : `Conversation: ${conversation?.chat?.title}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center">Chargement de la conversation...</div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {conversation?.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={msg.role === 'user' ? 'default' : 'secondary'}>
                        {msg.role === 'user' ? 'Utilisateur' : 'Assistant'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleString('fr-FR')}
                      </span>
                      {msg.model && <Badge variant="outline">{msg.model}</Badge>}
                    </div>

                    <div className={`p-4 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.parts?.map((part: any, idx: number) => (
                        <div key={idx}>
                          {part.type === 'text' && <p className="whitespace-pre-wrap">{part.text}</p>}
                          {part.type === 'tool-call' && <div className="text-sm opacity-70 mt-2">🔧 Tool: {part.toolName}</div>}
                        </div>
                      ))}
                    </div>

                    {(msg.inputTokens || msg.outputTokens || msg.completionTime) && (
                      <div className="text-xs text-muted-foreground">
                        {msg.inputTokens && `${msg.inputTokens} tokens in`}
                        {msg.outputTokens && ` • ${msg.outputTokens} tokens out`}
                        {msg.completionTime && ` • ${(msg.completionTime / 1000).toFixed(2)}s`}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={conversation?.user?.image} />
                      <AvatarFallback>{conversation?.user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
