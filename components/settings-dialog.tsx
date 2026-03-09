'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  getUserMessageCount,
  getSubDetails,
  getExtremeSearchUsageCount,
  getHistoricalUsage,
} from '@/app/actions';
import {
  MagnifyingGlassIcon,
  LightningIcon,
  CalendarIcon,
} from '@phosphor-icons/react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { cn, getSearchGroups, SearchGroupId } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useSelectedProfileIcon } from '@/hooks/use-selected-profile-icon';
import { useIsProUser } from '@/contexts/user-context';
import { HyperLogo } from './logos/hyper-logo';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserAccountIcon,
  Analytics01Icon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalSession } from '@/hooks/use-local-session';
import { GripIcon } from '@/components/ui/grip';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  subscriptionData?: any;
  isProUser?: boolean;
  isProStatusLoading?: boolean;
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
            Les informations de profil sont gérées par votre fournisseur d'authentification. Contactez le support pour mettre à jour vos informations.
          </p>
        </div>
      </div>
    </div>
  );
}

// Component for Agent Preferences
export function PreferencesSection({ user }: { user: any }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [searchProvider] = useLocalStorage<'exa' | 'parallel' | 'tavily' | 'firecrawl'>(
    'hyper-search-provider',
    'parallel',
  );

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
      toast.error("Impossible d'enregistrer l'ordre");
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

  return (
    <div className={cn('space-y-6', isMobile ? 'space-y-4' : 'space-y-6')}>
      <div>
        <h3 className={cn('font-semibold mb-1.5', isMobile ? 'text-sm' : 'text-base')}>Préférences</h3>
        <p className={cn('text-muted-foreground', isMobile ? 'text-xs leading-relaxed' : 'text-xs')}>
          Réorganisez et gérez la visibilité de vos agents.
        </p>
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

          <p className="text-xs text-muted-foreground">L'ordre sera sauvegardé automatiquement.</p>
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
    </div>
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
    queryKey: ['historicalUsage', user?.id, 12],
    queryFn: () => getHistoricalUsage(user, 12),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const searchCount = usageData?.searchCount;
  const extremeSearchCount = usageData?.extremeSearchCount;

  // Generate loading stars data that matches real data structure
  const loadingStars = useMemo(() => {
    if (!historicalLoading) return [];

    const months = 12;
    const totalDays = months * 30;
    const futureDays = Math.min(15, Math.floor(totalDays * 0.08));
    const pastDays = totalDays - futureDays - 1;

    return Array.from({ length: months }, (_, monthIndex) => {
      const daysInMonth = 30;
      const monthOffset = (months - 1 - monthIndex) * 30;
      const isCurrentMonth = monthIndex === 0;
      const actualFutureDays = isCurrentMonth ? futureDays : 0;
      const actualPastDays = daysInMonth - actualFutureDays;

      return {
        month: new Date(2024, monthIndex, 1).toLocaleString('default', { month: 'short' }),
        days: Array.from({ length: daysInMonth }, (_, dayIndex) => ({
          level: 0,
          date: new Date(Date.now() - (monthOffset + actualPastDays - 1 - dayIndex) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })),
      };
    }).reverse();
  }, [historicalLoading]);

  const processedHistoricalData = useMemo(() => {
    if (historicalLoading || !Array.isArray(historicalUsageData) || historicalUsageData.length === 0) {
      return loadingStars;
    }

    const today = new Date();
    const months: { month: string; days: { level: number; date: string }[] }[] = [];

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.unshift({
        month: date.toLocaleString('default', { month: 'short' }),
        days: [],
      });
    }

    // Create a map of date -> count from historical data
    const historyMap = new Map<string, number>();
    historicalUsageData.forEach((item: { date: string; count: number }) => {
      historyMap.set(item.date, item.count);
    });

    // Fill in days for each month with data from history or zeros
    months.forEach((month, index) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = historyMap.get(dateStr) || 0;

        let level = 0;
        if (count > 0) {
          if (count >= 20) level = 4;
          else if (count >= 12) level = 3;
          else if (count >= 6) level = 2;
          else level = 1;
        }

        // Don't show future dates
        const isFuture = currentDate > today;
        if (!isFuture) {
          month.days.push({
            level,
            date: dateStr,
          });
        }
      }
    });

    return months;
  }, [historicalUsageData, historicalLoading, loadingStars]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchUsageData(), refetchHistoricalData()]);
    setIsRefreshing(false);
  };

  return (
    <div className={cn('space-y-4', isMobile ? 'space-y-3' : 'space-y-4')}>
      {/* Quick Stats */}
      <div className={cn('grid grid-cols-2 gap-3', isMobile ? 'gap-2' : 'gap-3')}>
        {/* Search count card */}
        <div
          className={cn(
            'bg-card rounded-xl border shadow-sm overflow-hidden',
            isMobile ? 'p-2.5' : 'p-4',
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-2', isMobile ? 'gap-1.5' : 'gap-2')}>
              <div className="flex items-center justify-center rounded-md bg-muted p-1.5">
                <MagnifyingGlassIcon className={cn('text-muted-foreground', isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} weight="bold" />
              </div>
              <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Recherches</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            {usageLoading ? (
              <Skeleton className={cn('bg-muted', isMobile ? 'h-6 w-16' : 'h-7 w-20')} />
            ) : (
              <span
                className={cn(
                  'font-semibold text-foreground tabular-nums tracking-tight',
                  isMobile ? 'text-lg' : 'text-xl',
                )}
              >
                {searchCount?.toLocaleString('fr-FR') ?? '—'}
              </span>
            )}
            <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>aujourd'hui</span>
          </div>
        </div>

        {/* Extreme Search count card */}
        <div
          className={cn(
            'bg-card rounded-xl border shadow-sm overflow-hidden',
            isMobile ? 'p-2.5' : 'p-4',
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-2', isMobile ? 'gap-1.5' : 'gap-2')}>
              <div className="flex items-center justify-center rounded-md bg-muted p-1.5">
                <LightningIcon className={cn('text-muted-foreground', isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} weight="bold" />
              </div>
              <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Recherches Profondes</span>
            </div>
          </div>
          <div className="flex items-end justify-between">
            {usageLoading ? (
              <Skeleton className={cn('bg-muted', isMobile ? 'h-6 w-16' : 'h-7 w-20')} />
            ) : (
              <span
                className={cn(
                  'font-semibold text-foreground tabular-nums tracking-tight',
                  isMobile ? 'text-lg' : 'text-xl',
                )}
              >
                {extremeSearchCount?.toLocaleString('fr-FR') ?? '—'}
              </span>
            )}
            <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>ce mois</span>
          </div>
        </div>
      </div>

      {/* Subscription info if available */}
      {usageData?.subscriptionDetails && (
        <div className={cn('bg-card rounded-xl border shadow-sm', isMobile ? 'p-3' : 'p-4')}>
          <div className="flex items-center justify-between mb-2">
            <div className={cn('flex items-center gap-2', isMobile ? 'gap-1.5' : 'gap-2')}>
              <div className="flex items-center justify-center rounded-md bg-muted p-1.5">
                <CalendarIcon className={cn('text-muted-foreground', isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} weight="bold" />
              </div>
              <span className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>Abonnement</span>
            </div>
            {usageData.subscriptionDetails.plan && (
              <Badge
                variant="secondary"
                className={cn(
                  isMobile ? 'text-[9px] px-1.5 py-0.5' : 'text-xs',
                  usageData.subscriptionDetails.plan === 'Pro'
                    ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {usageData.subscriptionDetails.plan}
              </Badge>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className={cn('font-medium text-foreground', isMobile ? 'text-sm' : 'text-base')}>
                {usageData.subscriptionDetails.status === 'active' ? 'Actif' : usageData.subscriptionDetails.status}
              </span>
              {usageData.subscriptionDetails.renewsAt && (
                <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                  Renouvellement le {new Date(usageData.subscriptionDetails.renewsAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Graph Section */}
      {(historicalLoading || (Array.isArray(historicalUsageData) && historicalUsageData.length > 0)) && (
        <div className={cn('bg-card rounded-xl border shadow-sm', isMobile ? 'p-3' : 'p-4')}>
          <div className="flex items-center justify-between mb-3">
            <div className={cn('flex items-center gap-2', isMobile ? 'gap-1.5' : 'gap-2')}>
              <div className="flex items-center justify-center rounded-md bg-muted p-1.5">
                <CalendarIcon className={cn('text-muted-foreground', isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4')} weight="bold" />
              </div>
              <div>
                <h3 className={cn('font-medium text-foreground', isMobile ? 'text-sm' : 'text-sm')}>Activité</h3>
                <p className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                  {Array.isArray(historicalUsageData)
                    ? historicalUsageData.reduce((sum, item) => sum + item.count, 0).toLocaleString('fr-FR')
                    : '—'} recherches (12 derniers mois)
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-3">
              <TooltipProvider delayDuration={0}>
                <div className={cn('flex gap-1 overflow-x-auto pb-1', historicalLoading && 'animate-pulse')}>
                  {(historicalLoading ? loadingStars : processedHistoricalData).map((month, monthIndex) => (
                    <div key={month.month || monthIndex} className="flex flex-col gap-0.5 shrink-0">
                      <div className="text-[10px] text-muted-foreground text-center mb-1">{month.month}</div>
                      <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
                        {month.days.map((day, dayIndex) =>
                          historicalLoading ? (
                            <div key={dayIndex} className="w-2.5 h-2.5 rounded-sm bg-muted" />
                          ) : (
                            <Tooltip key={`${month.month}-${dayIndex}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'w-2.5 h-2.5 rounded-sm cursor-pointer transition-opacity hover:opacity-70',
                                    day.level === 0 && 'bg-muted',
                                    day.level === 1 && 'bg-primary/30',
                                    day.level === 2 && 'bg-primary/50',
                                    day.level === 3 && 'bg-primary/70',
                                    day.level === 4 && 'bg-primary',
                                  )}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p className="font-medium">
                                  {new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                                <p className="text-muted-foreground">
                                  {(Array.isArray(historicalUsageData)
                                    ? historicalUsageData.find((h) => h.date === day.date)?.count
                                    : undefined) ?? 0}{' '}
                                  recherches
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {!historicalLoading && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] text-muted-foreground">Moins</span>
                    {([0, 1, 2, 3, 4] as const).map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'w-2.5 h-2.5 rounded-sm',
                          level === 0 && 'bg-muted',
                          level === 1 && 'bg-primary/30',
                          level === 2 && 'bg-primary/50',
                          level === 3 && 'bg-primary/70',
                          level === 4 && 'bg-primary',
                        )}
                      />
                    ))}
                    <span className="text-[10px] text-muted-foreground">Plus</span>
                  </div>
                )}
              </TooltipProvider>
            </div>
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
        <PreferencesSection user={user} />
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
