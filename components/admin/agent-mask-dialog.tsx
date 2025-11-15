"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff, Search } from "lucide-react";
import { toast } from "sonner";

const AGENT_LABELS: Record<string, string> = {
  web: "Web Search",
  x: "X (Twitter)",
  academic: "Academic Papers",
  youtube: "YouTube",
  reddit: "Reddit",
  stocks: "Stocks",
  chat: "Chat",
  extreme: "Extreme Search",
  memory: "Memory",
  crypto: "Crypto",
  code: "Code",
  connectors: "Connectors",
  cyrus: "Cyrus",
  libeller: "Libeller",
  nomenclature: "Nomenclature",
  pdfExcel: "PDF to Excel",
};

interface AgentMaskData {
  id: string;
  agentId: string;
  userId: string;
  enabled: boolean;
  masked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentMaskDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentMaskDialog({
  userId,
  open,
  onOpenChange,
}: AgentMaskDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: agents = [], refetch } = useQuery({
    queryKey: ["agent-access", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/agents`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    enabled: open,
  });

  const maskMutation = useMutation({
    mutationFn: async ({
      agentId,
      masked,
    }: {
      agentId: string;
      masked: boolean;
    }) => {
      const res = await fetch(`/api/admin/users/${userId}/agents-mask`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId, masked }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update agent mask");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Agent masqué avec succès");
      refetch();
      // Invalider le cache pour forcer le rafraîchissement partout
      queryClient.invalidateQueries({ queryKey: ["agent-access", userId] });
      queryClient.invalidateQueries({ queryKey: ["agent-access"] });
    },
    onError: () => {
      toast.error("Erreur lors du masquage de l'agent");
    },
  });

  const handleToggleMask = (agentId: string, currentMasked: boolean) => {
    maskMutation.mutate({ agentId, masked: !currentMasked });
  };

  const filteredAgents = agents.filter((agent: AgentMaskData) =>
    (AGENT_LABELS[agent.agentId] || agent.agentId)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Masquer les agents</DialogTitle>
          <DialogDescription>
            Gérez la visibilité des agents pour cet utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredAgents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun agent trouvé
                </p>
              ) : (
                filteredAgents.map((agent: AgentMaskData) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {AGENT_LABELS[agent.agentId] || agent.agentId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.agentId}
                        </p>
                      </div>
                      {agent.masked && (
                        <Badge variant="secondary" className="text-xs">
                          Masqué
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleToggleMask(agent.agentId, agent.masked)
                      }
                      disabled={maskMutation.isPending}
                      className="ml-2"
                    >
                      {agent.masked ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
