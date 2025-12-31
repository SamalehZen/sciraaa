'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  getUserMessageCount,
  getCustomInstructions,
  saveCustomInstructions,
  deleteCustomInstructionsAction,
} from '@/app/actions';
import {
  FloppyDiskIcon,
  RobotIcon,
} from '@phosphor-icons/react';

import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrashIcon } from 'lucide-react';
import { cn, getSearchGroups, SearchGroupId } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useIsProUser } from '@/contexts/user-context';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Settings02Icon,
  GlobalSearchIcon,
} from '@hugeicons/core-free-icons';
import { GripIcon } from '@/components/ui/grip';
import { useMemo, useState, useEffect } from 'react';
import { useLocalSession } from '@/hooks/use-local-session';

// Component for Profile Information
function ProfileSection({ user, isProStatusLoading }: any) {
  const { isProUser: fastProStatus, isLoading: fastProLoading } = useIsProUser();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isProUserActive: boolean = user?.isProUser || fastProStatus || false;
  const showProLoading: boolean = Boolean(fastProLoading || isProStatusLoading);

  return (
    <div>
      <div className={cn('flex flex-col items-center text-center space-y-3', isMobile ? 'pb-2' : 'pb-4')}>
        <Avatar className={isMobile ? 'h-16 w-16' : 'h-20 w-20'}>
          <AvatarImage src={user?.image || ''} />
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
            Les informations de profil sont gérées par votre fournisseur d’authentification.
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
        // @ts-ignore
        if ('requireAuth' in group && group.requireAuth && !session) return false;
        if (group.id === 'extreme' as any) return false;
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
      </div>

      {/* Agent Visibility Section */}
      <div className="space-y-3">
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
      </div>

      {/* Custom Instructions Section */}
      <div className="space-y-3">
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
      </div>
    </div>
  );
}
