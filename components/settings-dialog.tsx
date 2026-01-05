'use client';
import { OpenRouterKeyInput, OpenRouterUrlInput } from '@/components/openrouter-inputs';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  getUserMessageCount,
  getSubDetails,
  getExtremeSearchUsageCount,
  getHistoricalUsage,
  getCustomInstructions,
  saveCustomInstructions,
  deleteCustomInstructionsAction,
  createConnectorAction,
  listUserConnectorsAction,
  deleteConnectorAction,
  manualSyncConnectorAction,
  getConnectorSyncStatusAction,
} from '@/app/actions';
import { SEARCH_LIMITS } from '@/lib/constants';
import {
  MagnifyingGlassIcon,
  LightningIcon,
  CalendarIcon,
  TrashIcon,
  FloppyDiskIcon,
  ArrowClockwiseIcon,
  RobotIcon,
} from '@phosphor-icons/react';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getAllMemories, searchMemories, deleteMemory, MemoryItem } from '@/lib/memory-actions';
import { Loader2, Search } from 'lucide-react';
import { cn, getSearchGroups, SearchGroupId } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useSelectedProfileIcon } from '@/hooks/use-selected-profile-icon';
import { useIsProUser } from '@/contexts/user-context';
import { HyperLogo } from './logos/hyper-logo';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Crown02Icon,
  UserAccountIcon,
  Analytics01Icon,
  Settings02Icon,
  Brain02Icon,
  GlobalSearchIcon,
  ConnectIcon,
  InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import {
  ContributionGraph,
  ContributionGraphCalendar,
  ContributionGraphBlock,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from '@/components/ui/kibo-ui/contribution-graph';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalSession } from '@/hooks/use-local-session';
import { GripIcon } from '@/components/ui/grip';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ConnectorProvider = 'google_drive' | 'notion' | 'slack' | 'github';
type ConnectorConfig = {
  id: ConnectorProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
};

const CONNECTOR_CONFIGS: Record<ConnectorProvider, ConnectorConfig> = {
  google_drive: {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Connectez votre Drive pour indexer des documents',
    icon: 'google-drive',
    color: '#4285F4',
    enabled: false,
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Connectez Notion pour rechercher pages et bases',
    icon: 'notion',
    color: '#000000',
    enabled: false,
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Connectez Slack pour retrouver messages et fichiers',
    icon: 'slack',
    color: '#4A154B',
    enabled: false,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Connectez GitHub pour rechercher du code',
    icon: 'github',
    color: '#181717',
    enabled: false,
  },
};

const CONNECTOR_ICONS: Record<ConnectorProvider, string> = {
  google_drive: '📁',
  notion: '📝',
  slack: '💬',
  github: '🐙',
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  subscriptionData?: any;
  isProUser?: boolean;
  isProStatusLoading?: boolean;
  isCustomInstructionsEnabled?: boolean;
  setIsCustomInstructionsEnabled?: (value: boolean | ((val: boolean) => boolean)) => void;
  initialTab?: string;
}

// Component for Profile Information
function ProfileSection({ user, subscriptionData, isProUser, isProStatusLoading }: any) {
  const { isProUser: fastProStatus, isLoading: fastProLoading } = useIsProUser();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const selectedProfileIcon = useSelectedProfileIcon();

  // Use comprehensive Pro status from user data (includes both Polar + DodoPayments)
  const isProUserActive: boolean = user?.isProUser || fastProStatus || false;
  const showProLoading: boolean = Boolean(fastProLoading || isProStatusLoading);

  return (
    <div>
      <div className={cn('flex flex-col items-center text-center space-y-3', isMobile ? 'pb-2' : 'pb-4')}>
        <Avatar className={isMobile ? 'h-16 w-16' : 'h-20 w-20'}>
          <AvatarImage src={user?.image || selectedProfileIcon || ''} />
          <AvatarFallback className={isMobile ? 'text-base' : 'text-lg'}>
            {user?.name
              ? user.name
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
              : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>{user?.name}</h3>
          <p className={cn('text-muted-foreground', isMobile ? 'text-xs' : 'text-sm')}>{user?.email}</p>
          {showProLoading ? (
            <Skeleton className="h-5 w-16 mx-auto" />
          ) : (
            isProUserActive && (
              <span
                className={cn(
                  'font-baumans! px-2 pt-1 pb-2 inline-flex leading-5 mt-2 items-center rounded-lg shadow-sm border-transparent ring-1 ring-ring/35 ring-offset-1 ring-offset-background',
                  'bg-gradient-to-br from-secondary/25 via-primary/20 to-accent/25 text-foreground',
                  'dark:bg-gradient-to-br dark:from-primary dark:via-secondary dark:to-primary dark:text-foreground',
                )}
              >
                utilisateur Pro
              </span>
            )
          )}
        </div>
      </div>

      <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
        <div className={cn('bg-muted/50 rounded-lg space-y-3', isMobile ? 'p-3' : 'p-4')}>
          <div>
            <Label className="text-xs text-muted-foreground">Nom complet</Label>
            <p className="text-sm font-medium mt-1">{user?.name || 'Non renseigné'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Adresse e-mail</Label>
            <p className="text-sm font-medium mt-1 break-all">{user?.email || 'Non renseigné'}</p>
          </div>
        </div>

        <div className={cn('bg-muted/30 rounded-lg border border-border', isMobile ? 'p-2.5' : 'p-3')}>
          <p className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>
            Les informations de profil sont gérées par votre fournisseur d’authentification. Contactez le support pour mettre à jour vos informations.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icon components for search providers
const ParallelIcon = ({ className }: { className?: string }) => (
  <Image
    src="/parallel-icon.svg"
    alt="Parallel AI"
    width={16}
    height={16}
    className={cn('bg-white rounded-full p-0.5', className)}
  />
);

const ExaIcon = ({ className }: { className?: string }) => (
  <Image src="/exa-color.svg" alt="Exa" width={16} height={16} className={className} />
);

const TavilyIcon = ({ className }: { className?: string }) => (
  <Image src="/tavily-color.svg" alt="Tavily" width={16} height={16} className={className} />
);

const FirecrawlIcon = ({ className }: { className?: string }) => (
  <span className={cn('text-base sm:text-lg !mb-3 !pr-1', className)}>🔥</span>
);

// Search Provider Options
const searchProviders = [
  {
    value: 'firecrawl',
    label: 'Firecrawl',
    description: 'Recherche Web, actualités et images avec capacités d’extraction de contenu',
    icon: FirecrawlIcon,
    default: false,
  },
  {
    value: 'exa',
    label: 'Exa',
    description: 'Recherche Web améliorée et plus rapide avec images et filtres avancés',
    icon: ExaIcon,
    default: false,
  },
  {
    value: 'parallel',
    label: 'Parallel AI',
    description: 'Recherche Web de base et premium ainsi que prise en charge de la recherche d’images Firecrawl',
    icon: ParallelIcon,
    default: true,
  },
  {
    value: 'tavily',
    label: 'Tavily',
    description: 'Recherche Web étendue avec résultats complets et analyse',
    icon: TavilyIcon,
    default: false,
  },
] as const;

// Search Provider Selector Component
function SearchProviderSelector({
  value,
  onValueChange,
  disabled,
  className,
}: {
  value: string;
  onValueChange: (value: 'exa' | 'parallel' | 'tavily' | 'firecrawl') => void;
  disabled?: boolean;
  className?: string;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const currentProvider = searchProviders.find((provider) => provider.value === value);

  return (
    <div className="w-full">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full h-auto min-h-18 sm:min-h-14 p-4',
            'border border-input bg-background',
            'transition-all duration-200',
            'focus:outline-none focus:ring-0 focus:ring-offset-0',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {currentProvider && (
              <>
                <currentProvider.icon className="text-muted-foreground size-4 flex-shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2 mb-0.5">
                    {currentProvider.label}
                    {currentProvider.default && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0.5 bg-primary/10 text-primary border-0">
                        Par défaut
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight line-clamp-2 text-wrap">
                    {currentProvider.description}
                  </div>
                </div>
              </>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-32px)]">
          {searchProviders.map((provider) => (
            <SelectItem key={provider.value} value={provider.value}>
              <div className="flex items-center gap-2.5">
                <provider.icon className="text-muted-foreground size-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {provider.label}
                    {provider.default && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0.5 bg-primary/10 text-primary border-0">
                        Par défaut
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Component for Combined Preferences (Search + Custom Instructions)
export function PreferencesSection({
  user,
  isCustomInstructionsEnabled,
  setIsCustomInstructionsEnabled,
}: {
  user: any;
  isCustomInstructionsEnabled?: boolean;
  setIsCustomInstructionsEnabled?: (value: boolean | ((val: boolean) => boolean)) => void;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [searchProvider, setSearchProvider] = useLocalStorage<'exa' | 'parallel' | 'tavily' | 'firecrawl'>(
    'hyper-search-provider',
    'parallel',
  );

  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const enabled = isCustomInstructionsEnabled ?? true;
  const setEnabled = setIsCustomInstructionsEnabled ?? (() => { });

  const handleSearchProviderChange = (newProvider: 'exa' | 'parallel' | 'tavily' | 'firecrawl') => {
    setSearchProvider(newProvider);
    toast.success(
      `Moteur de recherche changé pour ${newProvider === 'exa'
        ? 'Exa'
        : newProvider === 'parallel'
          ? 'Parallel AI'
          : newProvider === 'tavily'
            ? 'Tavily'
            : 'Firecrawl'
      }`,
    );
  };

  // Agents reordering (drag-and-drop)
  const { data: session } = useLocalSession();
  const [hiddenAgents, setHiddenAgents] = useLocalStorage<string[]>('hyper-hidden-agents', []);
  const dynamicGroups = useMemo(() => getSearchGroups(searchProvider, hiddenAgents), [searchProvider, hiddenAgents]);
  const reorderVisibleGroups = useMemo(
    () =>
      dynamicGroups.filter((group) => {
        if (!group.show) return false;
        if ('requireAuth' in group && group.requireAuth && !session) return false;
        if (group.id === 'extreme' || group.id === 'pdfExcel') return false;
        return true;
      }),
    [dynamicGroups, session],
  );
  const reorderVisibleIds = useMemo(() => reorderVisibleGroups.map((g) => g.id), [reorderVisibleGroups]);

  const defaultAgentOrder = useMemo(() => {
    const preferred: SearchGroupId[] = ['cyrus', 'libeller', 'nomenclature'].filter((id) =>
      reorderVisibleIds.includes(id as SearchGroupId),
    ) as SearchGroupId[];
    const rest = reorderVisibleIds.filter((id) => !preferred.includes(id as SearchGroupId)) as SearchGroupId[];
    return [...preferred, ...rest] as SearchGroupId[];
  }, [reorderVisibleIds]);

  const [agentOrder, setAgentOrder] = useLocalStorage<SearchGroupId[]>('hyper-agent-order', defaultAgentOrder);

  const normalizedAgentOrder = useMemo(() => {
    const filtered = agentOrder.filter((id) => reorderVisibleIds.includes(id));
    const missing = reorderVisibleIds.filter((id) => !filtered.includes(id));
    return [...filtered, ...missing] as SearchGroupId[];
  }, [agentOrder, reorderVisibleIds]);

  useEffect(() => {
    if (normalizedAgentOrder.length !== agentOrder.length || normalizedAgentOrder.some((id, i) => id !== agentOrder[i])) {
      setAgentOrder(normalizedAgentOrder);
    }
  }, [normalizedAgentOrder, agentOrder, setAgentOrder]);

  const [items, setItems] = useState<SearchGroupId[]>(normalizedAgentOrder);

  useEffect(() => setItems(normalizedAgentOrder), [normalizedAgentOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAgentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(active.id as SearchGroupId);
    const newIndex = items.indexOf(over.id as SearchGroupId);
    if (oldIndex === -1 || newIndex === -1) return;
    const previous = items;
    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);
    try {
      setAgentOrder(newItems);
      toast.success('Ordre des agents mis à jour');
    } catch (e) {
      setItems(previous);
      toast.error('Impossible d’enregistrer l’ordre');
    }
  };

  const handleToggleAgentVisibility = (agentId: string) => {
    setHiddenAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  };

  function SortableAgentCard({ id }: { id: SearchGroupId }) {
    const group = reorderVisibleGroups.find((g) => g.id === id);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    } as React.CSSProperties;
    if (!group) return null;
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'rounded-lg border bg-card p-3 sm:p-4 flex items-start gap-2.5 select-none',
          'cursor-grab active:cursor-grabbing',
          isDragging ? 'shadow-lg ring-1 ring-primary/30' : 'hover:shadow-sm',
        )}
        aria-grabbed={isDragging}
      >
        <div className="flex items-center justify-center rounded-md bg-muted/50 p-1.5">
          <HugeiconsIcon icon={group.icon} size={20} color="currentColor" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{group.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{group.description}</div>
            </div>
            <button
              className="ml-2 p-1 text-muted-foreground/80 hover:text-foreground rounded focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Déplacer"
              {...attributes}
              {...listeners}
            >
              <GripIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Custom Instructions queries and handlers
  const {
    data: customInstructions,
    isLoading: customInstructionsLoading,
    refetch,
  } = useQuery({
    queryKey: ['customInstructions', user?.id],
    queryFn: () => getCustomInstructions(user),
    enabled: !!user,
  });

  useEffect(() => {
    if (customInstructions?.content) {
      setContent(customInstructions.content);
    }
  }, [customInstructions]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Veuillez saisir des instructions');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveCustomInstructions(content);
      if (result.success) {
        toast.success('Instructions personnalisées enregistrées');
        refetch();
      } else {
        toast.error(result.error || 'Échec de l’enregistrement des instructions');
      }
    } catch (error) {
      toast.error('Échec de l’enregistrement des instructions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      const result = await deleteCustomInstructionsAction();
      if (result.success) {
        toast.success('Instructions personnalisées supprimées');
        setContent('');
        refetch();
      } else {
        toast.error(result.error || 'Échec de la suppression des instructions');
      }
    } catch (error) {
      toast.error('Échec de la suppression des instructions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('space-y-6', isMobile ? 'space-y-4' : 'space-y-6')}>
      <div>
        <h3 className={cn('font-semibold mb-1.5', isMobile ? 'text-sm' : 'text-base')}>Préférences</h3>
        <p className={cn('text-muted-foreground', isMobile ? 'text-xs leading-relaxed' : 'text-xs')}>
          Configurez votre moteur de recherche et personnalisez la façon dont l’IA répond à vos questions.
        </p>
      </div>

      {/* Search Provider Section */}
      <div className="space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <HugeiconsIcon icon={GlobalSearchIcon} className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Moteur de recherche</h4>
              <p className="text-xs text-muted-foreground">Choisissez votre moteur de recherche préféré</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <SearchProviderSelector value={searchProvider} onValueChange={handleSearchProviderChange} />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sélectionnez votre moteur de recherche préféré pour les recherches Web. Les changements prennent effet immédiatement et seront utilisés pour toutes les recherches futures.
            </p>
          </div>
        </div>
      </div>

      {/* OpenRouter Configuration Section */}
      <div className="space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <LightningIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Configuration OpenRouter</h4>
              <p className="text-xs text-muted-foreground">Utilisez votre propre clé API pour tester tous les modèles</p>
            </div>
          </div>

          <div className="grid gap-3 p-3 rounded-lg border bg-card">
            <div>
              <Label htmlFor="openrouter-key" className="text-sm font-medium">Clé API OpenRouter</Label>
              <OpenRouterKeyInput />
            </div>
            <div>
              <Label htmlFor="openrouter-url" className="text-sm font-medium">Base URL (Optionnel)</Label>
              <OpenRouterUrlInput />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Laissez vide pour utiliser la configuration par défaut. Si renseigné, cette clé sera utilisée pour les appels IA.
            </p>
          </div>
        </div>
      </div>

      {/* Agents Reorder Section */}
      <div className="space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <HugeiconsIcon icon={Settings02Icon} className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Réorganiser les Agents</h4>
              <p className="text-xs text-muted-foreground">Faites glisser pour définir votre ordre préféré</p>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleAgentDragEnd}>
            <SortableContext items={items} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {items.map((id) => (
                  <SortableAgentCard key={id} id={id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-muted-foreground">L’ordre sera sauvegardé automatiquement.</p>
        </div>
      </div >

      {/* Agent Visibility Section */}
      < div className="space-y-3" >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <HugeiconsIcon icon={Settings02Icon} className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Masquer les Agents</h4>
                <p className="text-xs text-muted-foreground">Contrôlez les agents qui apparaissent dans le menu</p>
              </div>
            </div>
            {hiddenAgents.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setHiddenAgents([])}>
                Réactiver tout
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {reorderVisibleGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-lg border bg-card p-3 sm:p-4 flex items-start gap-2.5 select-none"
              >
                <div className="flex items-center justify-center rounded-md bg-muted/50 p-1.5">
                  <HugeiconsIcon icon={group.icon} size={20} color="currentColor" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{group.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{group.description}</div>
                    </div>
                    <Switch
                      checked={!hiddenAgents.includes(group.id)}
                      onCheckedChange={() => handleToggleAgentVisibility(group.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Les modifications sont sauvegardées automatiquement.</p>
        </div>
      </div >

      {/* Custom Instructions Section */}
      < div className="space-y-3" >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <RobotIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Instructions personnalisées</h4>
              <p className="text-xs text-muted-foreground">Personnalisez la façon dont l’IA vous répond</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-lg border bg-card">
              <div className="flex-1 mr-3">
                <Label htmlFor="enable-instructions" className="text-sm font-medium">
                  Activer les instructions personnalisées
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">Activez ou désactivez les instructions personnalisées</p>
              </div>
              <Switch id="enable-instructions" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className={cn('space-y-3', !enabled && 'opacity-50')}>
              <div>
                <Label htmlFor="instructions" className="text-sm font-medium">
                  Instructions
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">Définissez la façon dont l’IA répond à vos questions</p>
                {customInstructionsLoading ? (
                  <Skeleton className="h-28 w-full" />
                ) : (
                  <Textarea
                    id="instructions"
                    placeholder="Saisissez vos instructions personnalisées ici… Par exemple : ‘Fournir toujours des exemples de code lors des explications’ ou ‘Rester concis et axé sur les applications pratiques’."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] resize-y text-sm"
                    style={{ maxHeight: '25dvh' }}
                    onFocus={(e) => {
                      // Keep the focused textarea within the drawer's scroll container without jumping the whole viewport
                      try {
                        e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                      } catch { }
                    }}
                    disabled={isSaving || !enabled}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !content.trim() || customInstructionsLoading || !enabled}
                  size="sm"
                  className="flex-1 h-8"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <FloppyDiskIcon className="w-3 h-3 mr-1.5" />
                      Enregistrer les instructions
                    </>
                  )}
                </Button>
                {customInstructions && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isSaving || customInstructionsLoading || !enabled}
                    size="sm"
                    className="h-8 px-2.5"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {customInstructionsLoading ? (
                <div className="p-2.5 bg-muted/30 rounded-lg">
                  <Skeleton className="h-3 w-28" />
                </div>
              ) : customInstructions ? (
                <div className="p-2.5 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Dernière mise à jour : {new Date(customInstructions.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
}

// Component for Usage Information
export function UsageSection({ user }: any) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isProUser = user?.isProUser;

  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsageData,
  } = useQuery({
    queryKey: ['usageData'],
    queryFn: async () => {
      const [searchCount, extremeSearchCount, subscriptionDetails] = await Promise.all([
        getUserMessageCount(),
        getExtremeSearchUsageCount(),
        getSubDetails(),
      ]);

      return {
        searchCount,
        extremeSearchCount,
        subscriptionDetails,
      };
    },
    staleTime: 1000 * 60 * 3,
    enabled: !!user,
  });

  const {
    data: historicalUsageData,
    isLoading: historicalLoading,
    refetch: refetchHistoricalData,
  } = useQuery({
    queryKey: ['historicalUsage', user?.id, 9],
    queryFn: () => getHistoricalUsage(user, 9),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const searchCount = usageData?.searchCount;
  const extremeSearchCount = usageData?.extremeSearchCount;

  // Generate loading stars data that matches real data structure
  const loadingStars = useMemo(() => {
    if (!historicalLoading) return [];

    const months = 9;
    const totalDays = months * 30;
    const futureDays = Math.min(15, Math.floor(totalDays * 0.08));
    const pastDays = totalDays - futureDays - 1;

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + futureDays);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - pastDays);

    // Generate complete dataset like real getHistoricalUsage
    const completeData: Activity[] = [];
    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      // Randomly light up some dots for star effect
      const shouldLight = Math.random() > 0.85; // 15% chance
      const count = shouldLight ? Math.floor(Math.random() * 10) + 1 : 0;

      let level: 0 | 1 | 2 | 3 | 4;
      if (count === 0) level = 0;
      else if (count <= 3) level = 1;
      else if (count <= 7) level = 2;
      else if (count <= 12) level = 3;
      else level = 4;

      completeData.push({
        date: dateKey,
        count,
        level,
      });
    }

    return completeData;
  }, [historicalLoading]);

  const handleRefreshUsage = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([refetchUsageData(), refetchHistoricalData()]);
      toast.success('Données d’utilisation actualisées');
    } catch (error) {
      toast.error('Échec de l’actualisation des données d’utilisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  const usagePercentage = isProUser
    ? 0
    : Math.min(((searchCount?.count || 0) / SEARCH_LIMITS.DAILY_SEARCH_LIMIT) * 100, 100);

  return (
    <div className={cn(isMobile ? 'space-y-3' : 'space-y-4', isMobile && !isProUser ? 'pb-4' : '')}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Utilisation quotidienne des recherches</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshUsage}
          disabled={isRefreshing}
          className={isMobile ? 'h-7 px-1.5' : 'h-8 px-2'}
        >
          {isRefreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowClockwiseIcon className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      <div className={cn('grid grid-cols-2', isMobile ? 'gap-2' : 'gap-3')}>
        <div className={cn('bg-muted/50 rounded-lg space-y-1', isMobile ? 'p-2.5' : 'p-3')}>
          <div className="flex items-center justify-between">
            <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Aujourd’hui</span>
            <MagnifyingGlassIcon className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </div>
          {usageLoading ? (
            <Skeleton className={cn('font-semibold', isMobile ? 'text-base h-4' : 'text-lg h-5')} />
          ) : (
            <div className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>{searchCount?.count || 0}</div>
          )}
          <p className="text-[10px] text-muted-foreground">Recherches normales</p>
        </div>

        <div className={cn('bg-muted/50 rounded-lg space-y-1', isMobile ? 'p-2.5' : 'p-3')}>
          <div className="flex items-center justify-between">
            <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Extrême</span>
            <LightningIcon className={isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
          </div>
          {usageLoading ? (
            <Skeleton className={cn('font-semibold', isMobile ? 'text-base h-4' : 'text-lg h-5')} />
          ) : (
            <div className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
              {extremeSearchCount?.count || 0}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">Ce mois-ci</p>
        </div>
      </div>

      {!isProUser && (
        <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
          <div className={cn('bg-muted/30 rounded-lg space-y-2', isMobile ? 'p-2.5' : 'p-3')}>
            {usageLoading ? (
              <>
                <div className="flex justify-between text-xs">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </>
            ) : (
              <>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Limite quotidienne</span>
                  <span className="text-muted-foreground">{usagePercentage.toFixed(0)}%</span>
                </div>
                <Progress value={usagePercentage} className="h-1.5 [&>div]:transition-none" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>
                    {searchCount?.count || 0} / {SEARCH_LIMITS.DAILY_SEARCH_LIMIT}
                  </span>
                  <span>{Math.max(0, SEARCH_LIMITS.DAILY_SEARCH_LIMIT - (searchCount?.count || 0))} restantes</span>
                </div>
              </>
            )}
          </div>

          <div className={cn('bg-card rounded-lg border border-border', isMobile ? 'p-3' : 'p-4')}>
            <div className={cn('flex items-center gap-2', isMobile ? 'mb-1.5' : 'mb-2')}>
              <HugeiconsIcon icon={Crown02Icon} size={isMobile ? 14 : 16} color="currentColor" strokeWidth={1.5} />
              <span className={cn('font-semibold', isMobile ? 'text-xs' : 'text-sm')}>Passer en Pro</span>
            </div>
            <p className={cn('text-muted-foreground mb-3', isMobile ? 'text-[11px]' : 'text-xs')}>
              Get unlimited searches and premium features
            </p>
            <Button asChild size="sm" className={cn('w-full', isMobile ? 'h-7 text-xs' : 'h-8')}>
              <Link href="/pricing">Mettre à niveau maintenant</Link>
            </Button>
          </div>
        </div>
      )}

      {!usageLoading && (
        <div className={cn('space-y-2', isMobile && !isProUser ? 'pb-4' : '')}>
          <h4 className={cn('font-semibold text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>
            Activité (9 derniers mois)
          </h4>
          <div className={cn('bg-muted/50 dark:bg-card rounded-lg p-3')}>
            {historicalLoading ? (
              <TooltipProvider>
                <ContributionGraph
                  data={loadingStars}
                  blockSize={isMobile ? 8 : 12}
                  blockMargin={isMobile ? 3 : 4}
                  fontSize={isMobile ? 9 : 12}
                  labels={{
                    totalCount: 'Chargement des données d’activité…',
                    legend: {
                      less: 'Moins',
                      more: 'Plus',
                    },
                  }}
                  className="w-full opacity-60"
                >
                  <ContributionGraphCalendar
                    hideMonthLabels={false}
                    className={cn('text-muted-foreground', isMobile ? 'text-[9px]' : 'text-xs')}
                  >
                    {({ activity, dayIndex, weekIndex }) => (
                      <ContributionGraphBlock
                        key={`${weekIndex}-${dayIndex}-loading`}
                        activity={activity}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                        className={cn(
                          'data-[level="0"]:fill-muted/40',
                          'data-[level="1"]:fill-primary/30',
                          'data-[level="2"]:fill-primary/50',
                          'data-[level="3"]:fill-primary/70',
                          'data-[level="4"]:fill-primary/90',
                          activity.level > 0 && 'animate-pulse',
                        )}
                      />
                    )}
                  </ContributionGraphCalendar>
                  <ContributionGraphFooter
                    className={cn('pt-2 flex-col sm:flex-row', isMobile ? 'gap-1.5 items-start' : 'gap-2 items-center')}
                  >
                    <ContributionGraphTotalCount
                      className={cn('text-muted-foreground', isMobile ? 'text-[9px] mb-1' : 'text-xs')}
                    />
                    <ContributionGraphLegend className={cn('text-muted-foreground', isMobile ? 'flex-shrink-0' : '')}>
                      {({ level }) => (
                        <svg height={isMobile ? 8 : 12} width={isMobile ? 8 : 12}>
                          <rect
                            className={cn(
                              'stroke-[1px] stroke-border/50',
                              'data-[level="0"]:fill-muted/40',
                              'data-[level="1"]:fill-primary/30',
                              'data-[level="2"]:fill-primary/50',
                              'data-[level="3"]:fill-primary/70',
                              'data-[level="4"]:fill-primary/90',
                            )}
                            data-level={level}
                            height={isMobile ? 8 : 12}
                            rx={2}
                            ry={2}
                            width={isMobile ? 8 : 12}
                          />
                        </svg>
                      )}
                    </ContributionGraphLegend>
                  </ContributionGraphFooter>
                </ContributionGraph>
              </TooltipProvider>
            ) : historicalUsageData && historicalUsageData.length > 0 ? (
              <TooltipProvider>
                <ContributionGraph
                  data={historicalUsageData}
                  blockSize={isMobile ? 8 : 12}
                  blockMargin={isMobile ? 3 : 4}
                  fontSize={isMobile ? 9 : 12}
                  labels={{
                    totalCount: '{{count}} messages au total en {{year}}',
                    legend: {
                      less: 'Moins',
                      more: 'Plus',
                    },
                  }}
                  className="w-full"
                >
                  <ContributionGraphCalendar
                    hideMonthLabels={false}
                    className={cn('text-muted-foreground', isMobile ? 'text-[9px]' : 'text-xs')}
                  >
                    {({ activity, dayIndex, weekIndex }) => (
                      <Tooltip key={`${weekIndex}-${dayIndex}`}>
                        <TooltipTrigger asChild>
                          <g className="cursor-help">
                            <ContributionGraphBlock
                              activity={activity}
                              dayIndex={dayIndex}
                              weekIndex={weekIndex}
                              className={cn(
                                'data-[level="0"]:fill-muted',
                                'data-[level="1"]:fill-primary/20',
                                'data-[level="2"]:fill-primary/40',
                                'data-[level="3"]:fill-primary/60',
                                'data-[level="4"]:fill-primary',
                              )}
                            />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-center">
                            <p className="font-medium">
                              {activity.count} {activity.count === 1 ? 'message' : 'messages'}
                            </p>
                            <p className="text-xs text-muted">
                              {new Date(activity.date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </ContributionGraphCalendar>
                  <ContributionGraphFooter
                    className={cn('pt-2 flex-col sm:flex-row', isMobile ? 'gap-1.5 items-start' : 'gap-2 items-center')}
                  >
                    <ContributionGraphTotalCount
                      className={cn('text-muted-foreground', isMobile ? 'text-[9px] mb-1' : 'text-xs')}
                    />
                    <ContributionGraphLegend className={cn('text-muted-foreground', isMobile ? 'flex-shrink-0' : '')}>
                      {({ level }) => {
                        const getTooltipText = (level: number) => {
                          switch (level) {
                            case 0:
                              return 'Aucun message';
                            case 1:
                              return '1–3 messages';
                            case 2:
                              return '4–7 messages';
                            case 3:
                              return '8–12 messages';
                            case 4:
                              return '13+ messages';
                            default:
                              return `${level} messages`;
                          }
                        };

                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <svg height={isMobile ? 8 : 12} width={isMobile ? 8 : 12} className="cursor-help">
                                <rect
                                  className={cn(
                                    'stroke-[1px] stroke-border/50',
                                    'data-[level="0"]:fill-muted',
                                    'data-[level="1"]:fill-primary/20',
                                    'data-[level="2"]:fill-primary/40',
                                    'data-[level="3"]:fill-primary/60',
                                    'data-[level="4"]:fill-primary',
                                  )}
                                  data-level={level}
                                  height={isMobile ? 8 : 12}
                                  rx={2}
                                  ry={2}
                                  width={isMobile ? 8 : 12}
                                />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{getTooltipText(level)}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }}
                    </ContributionGraphLegend>
                  </ContributionGraphFooter>
                </ContributionGraph>
              </TooltipProvider>
            ) : (
              <div className="h-24 flex items-center justify-center">
                <p className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Aucune donnée d’activité</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



export function SettingsDialog({
  open,
  onOpenChange,
  user,
  subscriptionData,
  isProUser,
  isProStatusLoading,
  isCustomInstructionsEnabled,
  setIsCustomInstructionsEnabled,
  initialTab = 'profile',
}: SettingsDialogProps) {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Reset tab when initialTab changes or when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentTab(initialTab);
    }
  }, [open, initialTab]);
  // Dynamically stabilize drawer height on mobile when the virtual keyboard opens (PWA/iOS)
  const [mobileDrawerPxHeight, setMobileDrawerPxHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isMobile || !open) {
      setMobileDrawerPxHeight(null);
      return;
    }

    const updateHeight = () => {
      try {
        // Prefer VisualViewport for accurate height when keyboard is open
        const visualHeight = (window as any).visualViewport?.height ?? window.innerHeight;
        const computed = Math.min(600, Math.round(visualHeight * 0.85));
        setMobileDrawerPxHeight(computed);
      } catch {
        setMobileDrawerPxHeight(null);
      }
    };

    updateHeight();
    const vv: VisualViewport | undefined = (window as any).visualViewport;
    vv?.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      vv?.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, [isMobile, open]);

  const tabItems = [
    {
      value: 'profile',
      label: 'Compte',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={UserAccountIcon} className={className} />,
    },
    {
      value: 'usage',
      label: 'Utilisation',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={Analytics01Icon} className={className} />,
    },
    {
      value: 'preferences',
      label: 'Préférences',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={Settings02Icon} className={className} />,
    },
  ];

  const contentSections = (
    <>
      <TabsContent value="profile" className="mt-0">
        <ProfileSection
          user={user}
          subscriptionData={subscriptionData}
          isProUser={isProUser}
          isProStatusLoading={isProStatusLoading}
        />
      </TabsContent>

      <TabsContent value="usage" className="mt-0">
        <UsageSection user={user} />
      </TabsContent>

      <TabsContent
        value="preferences"
        className="mt-0 !scrollbar-thin !scrollbar-track-transparent !scrollbar-thumb-muted-foreground/20 hover:!scrollbar-thumb-muted-foreground/30"
      >
        <PreferencesSection
          user={user}
          isCustomInstructionsEnabled={isCustomInstructionsEnabled}
          setIsCustomInstructionsEnabled={setIsCustomInstructionsEnabled}
        />
      </TabsContent>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="h-[85vh] max-h-[600px] p-0 [&[data-vaul-drawer]]:transition-none overflow-hidden"
          style={{
            height: mobileDrawerPxHeight ?? undefined,
            maxHeight: mobileDrawerPxHeight ?? undefined,
          }}
        >
          <div className="flex flex-col h-full max-h-full">
            {/* Header - more compact */}
            <DrawerHeader className="pb-2 px-4 pt-3 shrink-0">
              <DrawerTitle className="text-base font-medium flex items-center gap-2">
                <HyperLogo className="size-6" />
                Paramètres
              </DrawerTitle>
            </DrawerHeader>

            {/* Content area with tabs */}
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="flex-1 flex flex-col overflow-hidden gap-0"
            >
              {/* Tab content - takes up most space */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 !pb-4 overscroll-contain !scrollbar-w-1 !scrollbar-track-transparent !scrollbar-thumb-muted-foreground/20 hover:!scrollbar-thumb-muted-foreground/30">
                {contentSections}
              </div>

              {/* Bottom tab navigation - compact and accessible */}
              <div
                className={cn(
                  'border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0',
                  currentTab === 'preferences' || currentTab === 'connectors'
                    ? 'pb-[calc(env(safe-area-inset-bottom)+2.5rem)]'
                    : 'pb-[calc(env(safe-area-inset-bottom)+1rem)]',
                )}
              >
                <TabsList className="w-full py-1.5 h-24 bg-transparent rounded-none grid grid-cols-3 sm:grid-cols-6 gap-2 !mb-2 px-3 sm:px-4">
                  {tabItems.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="flex-col gap-0.5 h-full rounded-md data-[state=active]:bg-muted data-[state=active]:shadow-none relative px-2 min-w-0 transition-colors"
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 transition-colors',
                          currentTab === item.value ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[10px] mt-0.5 transition-colors',
                          currentTab === item.value ? 'text-foreground font-medium' : 'text-muted-foreground',
                        )}
                      >
                        {item.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !w-full max-h-[85vh] !p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 !m-0">
          <DialogTitle className="text-xl font-medium tracking-normal flex items-center gap-2">
            <HyperLogo className="size-6" color="currentColor" />
            Paramètres
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 !m-0">
            <div className="p-2 !gap-1 flex flex-col">
              {tabItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCurrentTab(item.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    'hover:bg-muted',
                    currentTab === item.value
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(85vh-120px)] !scrollbar-w-1 !scrollbar-track-transparent !scrollbar-thumb-muted-foreground/20 hover:!scrollbar-thumb-muted-foreground/30">
              <div className="p-6 pb-8">
                <Tabs value={currentTab} onValueChange={setCurrentTab} orientation="vertical">
                  {contentSections}
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
