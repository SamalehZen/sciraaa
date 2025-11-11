'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Crown02Icon } from '@hugeicons/core-free-icons';

// Component for Subscription Information
function SubscriptionSection({ subscriptionData, isProUser, user }: any) {
  const [orders, setOrders] = useState<any>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use data from user object (already cached)
  const paymentHistory = user?.paymentHistory || null;
  const dodoProStatus = user?.dodoProStatus || null;

  useEffect(() => {
    setOrdersLoading(false);
    setOrders(null);
  }, []);

  const handleManageSubscription = async () => {
    // Determine the subscription source
    const getProAccessSource = () => {
      if (hasActiveSubscription) return 'polar';
      if (hasDodoProStatus) return 'dodo';
      return null;
    };

    const proSource = getProAccessSource();

    console.log('proSource', proSource);

    try {
      setIsManagingSubscription(true);

      console.log('Settings Dialog - Provider source:', proSource);
      console.log('User dodoProStatus:', user?.dodoProStatus);
      console.log('User full object keys:', Object.keys(user || {}));

      // Route to pricing page for managing billing without Better Auth integrations
      window.location.href = '/pricing';
    } catch (error) {
      console.error('Subscription management error:', error);

      if (proSource === 'dodo') {
        toast.error('Impossible d’accéder au portail DodoPayments. Veuillez contacter le support à zaid@hyper.vercel.app');
      } else {
        toast.error('Échec de l’ouverture de la gestion de l’abonnement');
      }
    } finally {
      setIsManagingSubscription(false);
    }
  };

  // Check for active status from either source
  const hasActiveSubscription =
    subscriptionData?.hasSubscription && subscriptionData?.subscription?.status === 'active';
  const hasDodoProStatus = dodoProStatus?.isProUser || (user?.proSource === 'dodo' && user?.isProUser);
  const isProUserActive = hasActiveSubscription || hasDodoProStatus;
  const subscription = subscriptionData?.subscription;

  // Check if DodoPayments Pro is expiring soon (within 7 days)
  const getDaysUntilExpiration = () => {
    if (!dodoProStatus?.expiresAt) return null;
    const now = new Date();
    const expiresAt = new Date(dodoProStatus.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();
  const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7 && daysUntilExpiration > 0;

  return (
    <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
      {isProUserActive ? (
        <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
          <div className={cn('bg-primary text-primary-foreground rounded-lg', isMobile ? 'p-3' : 'p-4')}>
            <div className={cn('flex items-start justify-between', isMobile ? 'mb-2' : 'mb-3')}>
              <div className="flex items-center gap-2">
                <div className={cn('bg-primary-foreground/20 rounded', isMobile ? 'p-1' : 'p-1.5')}>
                  <HugeiconsIcon icon={Crown02Icon} size={isMobile ? 14 : 16} color="currentColor" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className={cn('font-semibold', isMobile ? 'text-xs' : 'text-sm')}>
                    {hasActiveSubscription ? 'Abonnement PRO' : 'Adhésion PRO'}
                  </h3>
                  <p className={cn('opacity-90', isMobile ? 'text-[10px]' : 'text-xs')}>
                    {hasActiveSubscription
                      ? subscription?.status === 'active'
                        ? 'Actif'
                        : subscription?.status || 'Inconnu'
                      : 'Active (DodoPayments)'}
                  </p>
                </div>
              </div>
              <Badge
                className={cn(
                  'bg-primary-foreground/20 text-primary-foreground border-0',
                  isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs',
                )}
              >
                ACTIF
              </Badge>
            </div>
            <div className={cn('opacity-90 mb-3', isMobile ? 'text-[11px]' : 'text-xs')}>
              <p className="mb-1">Accès illimité à toutes les fonctionnalités premium</p>
              {hasActiveSubscription && subscription && (
                <div className="flex gap-4 text-[10px] opacity-75">
                  <span>
                    ${(subscription.amount / 100).toFixed(2)}/{subscription.recurringInterval}
                  </span>
                  <span>Prochaine facturation : {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
              {hasDodoProStatus && !hasActiveSubscription && (
                <div className="space-y-1">
                  <div className="flex gap-4 text-[10px] opacity-75">
                    <span>₹1500 (Paiement unique)</span>
                    <span>🇮🇳 Tarification indienne</span>
                  </div>
                  {dodoProStatus?.expiresAt && (
                    <div className="text-[10px] opacity-75">
                      <span>Expire le : {new Date(dodoProStatus.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {(hasActiveSubscription || hasDodoProStatus) && (
              <Button
                variant="secondary"
                onClick={handleManageSubscription}
                className={cn('w-full', isMobile ? 'h-7 text-xs' : 'h-8')}
                disabled={isManagingSubscription}
              >
                {isManagingSubscription ? (
                  <Loader2 className={isMobile ? 'h-3 w-3 mr-1.5' : 'h-3.5 w-3.5 mr-2'} />
                ) : (
                  <ExternalLink className={isMobile ? 'h-3 w-3 mr-1.5' : 'h-3.5 w-3.5 mr-2'} />
                )}
                {isManagingSubscription ? 'Ouverture…' : 'Gérer la facturation'}
              </Button>
            )}
          </div>

          {/* Expiration Warning for DodoPayments */}
          {isExpiringSoon && (
            <div
              className={cn(
                'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg',
                isMobile ? 'p-3' : 'p-4',
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn('bg-yellow-100 dark:bg-yellow-900/40 rounded', isMobile ? 'p-1' : 'p-1.5')}>
                  <HugeiconsIcon
                    icon={Crown02Icon}
                    size={isMobile ? 14 : 16}
                    color="currentColor"
                    strokeWidth={1.5}
                    className={cn('text-yellow-600 dark:text-yellow-500')}
                  />
                </div>
                <div className="flex-1">
                  <h4
                    className={cn(
                      'font-semibold text-yellow-800 dark:text-yellow-200',
                      isMobile ? 'text-xs' : 'text-sm',
                    )}
                  >
                    Accès Pro bientôt expiré
                  </h4>
                  <p
                    className={cn(
                      'text-yellow-700 dark:text-yellow-300',
                      isMobile ? 'text-[11px] mt-1' : 'text-xs mt-1',
                    )}
                  >
                    Votre accès Pro expire dans {daysUntilExpiration} {daysUntilExpiration === 1 ? 'jour' : 'jours'}. Renouvelez maintenant pour continuer à profiter des fonctionnalités illimitées.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className={cn(
                      'mt-2 bg-yellow-600 hover:bg-yellow-700 text-white',
                      isMobile ? 'h-7 text-xs' : 'h-8',
                    )}
                  >
                    <Link href="/pricing">Renouveler l’accès Pro</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
          <div className={cn('text-center border-2 border-dashed rounded-lg bg-muted/20', isMobile ? 'p-4' : 'p-6')}>
            <HugeiconsIcon
              icon={Crown02Icon}
              size={isMobile ? 24 : 32}
              color="currentColor"
              strokeWidth={1.5}
              className={cn('mx-auto text-muted-foreground mb-3')}
            />
            <h3 className={cn('font-semibold mb-1', isMobile ? 'text-sm' : 'text-base')}>Aucun abonnement actif</h3>
            <p className={cn('text-muted-foreground mb-4', isMobile ? 'text-[11px]' : 'text-xs')}>
              Passez en Pro pour un accès illimité
            </p>
            <div className="space-y-2">
              <Button asChild size="sm" className={cn('w-full', isMobile ? 'h-8 text-xs' : 'h-9')}>
                <Link href="/pricing">
                  <HugeiconsIcon
                    icon={Crown02Icon}
                    size={isMobile ? 12 : 14}
                    color="currentColor"
                    strokeWidth={1.5}
                    className={isMobile ? 'mr-1.5' : 'mr-2'}
                  />
                  Passer en Pro
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className={cn('w-full', isMobile ? 'h-7 text-xs' : 'h-8')}>
                <Link href="/pricing">Comparer les offres</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
        <h4 className={cn('font-semibold', isMobile ? 'text-xs' : 'text-sm')}>Historique de facturation</h4>
        {ordersLoading ? (
          <div className={cn('border rounded-lg flex items-center justify-center', isMobile ? 'p-3 h-16' : 'p-4 h-20')}>
            <Loader2 className={cn(isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4', 'animate-spin')} />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Show DodoPayments history */}
            {paymentHistory && paymentHistory.length > 0 && (
              <>
                {paymentHistory.slice(0, 3).map((payment: any) => (
                  <div key={payment.id} className={cn('bg-muted/30 rounded-lg', isMobile ? 'p-2.5' : 'p-3')}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium truncate', isMobile ? 'text-xs' : 'text-sm')}>
                          Hyper Pro (DodoPayments)
                        </p>
                        <div className="flex items-center gap-2">
                          <p className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant="secondary" className="text-[8px] px-1 py-0">
                            🇮🇳 INR
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn('font-semibold block', isMobile ? 'text-xs' : 'text-sm')}>
                          ₹{(payment.totalAmount / 100).toFixed(0)}
                        </span>
                        <span className={cn('text-muted-foreground', isMobile ? 'text-[9px]' : 'text-xs')}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Show Polar orders */}
            {orders?.result?.items && orders.result.items.length > 0 && (
              <>
                {orders.result.items.slice(0, 3).map((order: any) => (
                  <div key={order.id} className={cn('bg-muted/30 rounded-lg', isMobile ? 'p-2.5' : 'p-3')}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={cn('font-medium truncate', isMobile ? 'text-xs' : 'text-sm')}>
                          {order.product?.name || 'Subscription'}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <Badge variant="secondary" className="text-[8px] px-1 py-0">
                            🌍 USD
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={cn('font-semibold block', isMobile ? 'text-xs' : 'text-sm')}>
                          ${(order.totalAmount / 100).toFixed(2)}
                        </span>
                        <span className={cn('text-muted-foreground', isMobile ? 'text-[9px]' : 'text-xs')}>
                          recurring
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Show message if no billing history */}
            {(!paymentHistory || paymentHistory.length === 0) &&
              (!orders?.result?.items || orders.result.items.length === 0) && (
                <div
                  className={cn(
                    'border rounded-lg text-center bg-muted/20 flex items-center justify-center',
                    isMobile ? 'p-4 h-16' : 'p-6 h-20',
                  )}
                >
                  <p className={cn('text-muted-foreground', isMobile ? 'text-[11px]' : 'text-xs')}>
                    Aucun historique de facturation
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for Memories
function MemoriesSection() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingMemoryIds, setDeletingMemoryIds] = useState<Set<string>>(new Set());

  const {
    data: memoriesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: memoriesLoading,
  } = useInfiniteQuery({
    queryKey: ['memories'],
    queryFn: async ({ pageParam }) => {
      const pageNumber = pageParam as number;
      return await getAllMemories(pageNumber);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.memories.length >= 20;
      return hasMore ? Number(lastPage.memories[lastPage.memories.length - 1]?.id) : undefined;
    },
    staleTime: 1000 * 60 * 5,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: (_, memoryId) => {
      setDeletingMemoryIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      toast.success('Mémoire supprimée avec succès');
    },
    onError: (_, memoryId) => {
      setDeletingMemoryIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(memoryId);
        return newSet;
      });
      toast.error('Échec de la suppression de la mémoire');
    },
  });

  const handleDeleteMemory = (id: string) => {
    setDeletingMemoryIds((prev) => new Set(prev).add(id));
    deleteMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };

  const getMemoryContent = (memory: MemoryItem): string => {
    if (memory.summary) return memory.summary;
    if (memory.title) return memory.title;
    if (memory.memory) return memory.memory;
    if (memory.name) return memory.name;
    return 'No content available';
  };

  const displayedMemories = memoriesData?.pages.flatMap((page) => page.memories) || [];

  const totalMemories = memoriesData?.pages.reduce((acc, page) => acc + page.memories.length, 0) || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {totalMemories} {totalMemories === 1 ? 'memory' : 'memories'} stored
        </p>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 scrollbar-w-1 scrollbar-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30">
        {memoriesLoading && !displayedMemories.length ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : displayedMemories.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-32 border border-dashed rounded-lg bg-muted/20">
            <HugeiconsIcon icon={Brain02Icon} className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucune mémoire trouvée</p>
          </div>
        ) : (
          <>
            {displayedMemories.map((memory: MemoryItem) => (
              <div
                key={memory.id}
                className="group relative p-3 rounded-lg border bg-card/50 hover:bg-card transition-all"
              >
                <div className="pr-8">
                  {memory.title && <h4 className="text-sm font-medium mb-1 text-foreground">{memory.title}</h4>}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {memory.content || getMemoryContent(memory)}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{formatDate(memory.createdAt || memory.created_at || '')}</span>
                    </div>
                    {memory.type && (
                      <div className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] font-medium">{memory.type}</div>
                    )}
                    {memory.status && memory.status !== 'done' && (
                      <div className="px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-[9px] font-medium">
                        {memory.status}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMemory(memory.id)}
                  disabled={deletingMemoryIds.has(memory.id)}
                  className={cn(
                    'absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'touch-manipulation', // Better touch targets on mobile
                  )}
                  style={{ opacity: 1 }} // Always visible on mobile
                >
                  {deletingMemoryIds.has(memory.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <TrashIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
            ))}

            {hasNextPage && !searchQuery.trim() && (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  size="sm"
                  className="h-8"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Chargement…
                    </>
                  ) : (
                    'Charger plus'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 justify-center">
        <p className="text-xs text-muted-foreground">propulsé par</p>
        <Image src="/supermemory.svg" alt="Memories" className="invert dark:invert-0" width={140} height={140} />
      </div>
    </div>
  );
}

// Component for Connectors
function ConnectorsSection({ user }: { user: any }) {
  const isProUser = user?.isProUser || false;
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [connectingProvider, setConnectingProvider] = useState<ConnectorProvider | null>(null);
  const [syncingProvider, setSyncingProvider] = useState<ConnectorProvider | null>(null);
  const [deletingConnectionId, setDeletingConnectionId] = useState<string | null>(null);

  const {
    data: connectorsData,
    isLoading: connectorsLoading,
    refetch: refetchConnectors,
  } = useQuery({
    queryKey: ['connectors', user?.id],
    queryFn: listUserConnectorsAction,
    enabled: !!user && isProUser,
    staleTime: 1000 * 60 * 2,
  });

  // Query actual connection status for each provider using Supermemory API
  const connectionStatusQueries = useQuery({
    queryKey: ['connectorsStatus', user?.id],
    queryFn: async () => {
      if (!user?.id || !isProUser) return {};

      const statusPromises = Object.keys(CONNECTOR_CONFIGS).map(async (provider) => {
        try {
          const result = await getConnectorSyncStatusAction(provider as ConnectorProvider);
          return { provider, status: result };
        } catch (error) {
          console.error(`Failed to get status for ${provider}:`, error);
          return { provider, status: null };
        }
      });

      const statuses = await Promise.all(statusPromises);
      return statuses.reduce(
        (acc, { provider, status }) => {
          acc[provider] = status;
          return acc;
        },
        {} as Record<string, any>,
      );
    },
    enabled: !!user?.id && isProUser,
    staleTime: 1000 * 60 * 2,
  });

  const handleConnect = async (provider: ConnectorProvider) => {
    setConnectingProvider(provider);
    try {
      const result = await createConnectorAction(provider);
      if (result.success && result.authLink) {
        window.location.href = result.authLink;
      } else {
        toast.error(result.error || 'Failed to connect');
      }
    } catch (error) {
      toast.error('Failed to connect');
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleSync = async (provider: ConnectorProvider) => {
    setSyncingProvider(provider);
    try {
      const result = await manualSyncConnectorAction(provider);
      if (result.success) {
        toast.success(`${CONNECTOR_CONFIGS[provider].name} sync started`);
        refetchConnectors();
        // Refetch connection status after a delay to show updated counts
        setTimeout(() => {
          connectionStatusQueries.refetch();
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to sync');
      }
    } catch (error) {
      toast.error('Failed to sync');
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleDelete = async (connectionId: string, providerName: string) => {
    setDeletingConnectionId(connectionId);
    try {
      const result = await deleteConnectorAction(connectionId);
      if (result.success) {
        toast.success(`${providerName} disconnected`);
        refetchConnectors();
        // Also refetch connection statuses immediately to update the UI
        connectionStatusQueries.refetch();
      } else {
        toast.error(result.error || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    } finally {
      setDeletingConnectionId(null);
    }
  };

  const connections = connectorsData?.connections || [];
  const connectionStatuses = connectionStatusQueries.data || {};

  return (
    <div className={cn('space-y-4', isMobile ? 'space-y-3' : 'space-y-4')}>
      <div>
        <h3 className={cn('font-semibold mb-1', isMobile ? 'text-sm' : 'text-base')}>Services connectés</h3>
        <p className={cn('text-muted-foreground', isMobile ? 'text-[11px] leading-relaxed' : 'text-xs')}>
          Connectez vos services cloud pour rechercher dans tous vos documents en un seul endroit
        </p>
      </div>

      {/* Beta Announcement Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <HugeiconsIcon icon={InformationCircleIcon} className="h-4 w-4 text-primary" />
        <AlertTitle className="text-foreground">Connecteurs disponibles en bêta</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Les connecteurs sont désormais disponibles pour les utilisateurs Pro ! Notez que cette fonctionnalité est en bêta et peut encore évoluer.
        </AlertDescription>
      </Alert>

      {!isProUser && (
        <>
          <div className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center bg-primary/5">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <HugeiconsIcon
                  icon={Crown02Icon}
                  size={32}
                  color="currentColor"
                  strokeWidth={1.5}
                  className="text-primary"
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-lg">Fonctionnalité Pro</h4>
                <p className="text-muted-foreground text-sm max-w-md">
                  Les connecteurs sont réservés aux utilisateurs Pro. Passez en Pro pour connecter vos comptes Google Drive, Notion et OneDrive.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/pricing">
                  <HugeiconsIcon icon={Crown02Icon} size={16} color="currentColor" strokeWidth={1.5} className="mr-2" />
                  Passer en Pro
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}

      {isProUser && (
        <div className="space-y-3">
          {Object.entries(CONNECTOR_CONFIGS).map(([provider, config]) => {
            const connectionStatus = connectionStatuses[provider]?.status;
            const connection = connections.find((c) => c.provider === provider);
            // A connector is connected if we have a connection record OR if status check confirms it
            const isConnected = !!connection || (connectionStatus?.isConnected && connectionStatus !== null);
            const isConnecting = connectingProvider === provider;
            const isSyncing = syncingProvider === provider;
            const isDeleting = connection && deletingConnectionId === connection.id;
            const isStatusLoading = connectionStatusQueries.isLoading;
            const isComingSoon = provider === 'onedrive';

            return (
              <div key={provider} className={cn('border rounded-lg', isMobile ? 'p-3' : 'p-4')}>
                <div className={cn('flex items-center', isMobile ? 'gap-2' : 'justify-between')}>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 mt-0.5">
                      <div className="text-xl">
                        {(() => {
                          const IconComponent = CONNECTOR_ICONS[config.icon];
                          return IconComponent ? <IconComponent /> : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn('font-medium', isMobile ? 'text-[13px]' : 'text-sm')}>{config.name}</h4>
                      <p className={cn('text-muted-foreground', isMobile ? 'text-[10px] leading-tight' : 'text-xs')}>
                        {config.description}
                      </p>
                      {isComingSoon ? (
                        <div className={cn('flex items-center gap-2', isMobile ? 'mt-0.5' : 'mt-1')}>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span
                            className={cn('text-blue-600 dark:text-blue-400', isMobile ? 'text-[10px]' : 'text-xs')}
                          >
                            Coming Soon
                          </span>
                        </div>
                      ) : isStatusLoading && !connection ? (
                        <div className={cn('flex items-center gap-2', isMobile ? 'mt-0.5' : 'mt-1')}>
                          <div className="w-2 h-2 bg-muted animate-pulse rounded-full"></div>
                          <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                            Vérification de la connexion…
                          </span>
                        </div>
                      ) : isConnected ? (
                        <div className={cn('flex items-center gap-2', isMobile ? 'mt-0.5' : 'mt-1')}>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span
                            className={cn('text-green-600 dark:text-green-400', isMobile ? 'text-[10px]' : 'text-xs')}
                          >
                            Connected
                          </span>
                          {(connectionStatus?.email || connection?.email) && (
                            <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                              • {connectionStatus?.email || connection?.email}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={cn('flex items-center gap-2', isMobile ? 'mt-0.5' : 'mt-1')}>
                          <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                          <span className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>
                            Non connecté
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cn('flex items-center', isMobile ? 'gap-1' : 'gap-2')}>
                    {isComingSoon ? (
                      <Button
                        size="sm"
                        disabled
                        variant="outline"
                        className={cn(
                          'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                          isMobile ? 'h-7 text-[10px] px-2' : 'h-8',
                        )}
                      >
                        Coming Soon
                      </Button>
                    ) : isConnected ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(provider as ConnectorProvider)}
                          disabled={isSyncing || isDeleting || isStatusLoading}
                          className={cn(isMobile ? 'h-7 text-[10px] px-2' : 'h-8')}
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className={cn(isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3', 'animate-spin mr-1')} />
                              Syncing...
                            </>
                          ) : (
                            'Sync'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => connection && handleDelete(connection.id, config.name)}
                          disabled={isDeleting || isSyncing || isStatusLoading}
                          className={cn(
                            'text-destructive hover:text-destructive',
                            isMobile ? 'h-7 text-[10px] px-2' : 'h-8',
                          )}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className={cn(isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3', 'animate-spin mr-1')} />
                              Déconnexion…
                            </>
                          ) : (
                            'Déconnecter'
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(provider as ConnectorProvider)}
                        disabled={isConnecting || isStatusLoading}
                        className={cn(isMobile ? 'h-7 text-[10px] px-2' : 'h-8')}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className={cn(isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3', 'animate-spin mr-1')} />
                            Connexion…
                          </>
                        ) : (
                          'Connect'
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {isConnected && !isComingSoon && (
                  <div className={cn('border-t border-border', isMobile ? 'mt-2 pt-2' : 'mt-3 pt-3')}>
                    <div className={cn('text-xs', isMobile ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-3 gap-4')}>
                      <div>
                        <span className="text-muted-foreground">Bloc de documents :</span>
                        <div className="font-medium">
                          {isStatusLoading ? (
                            <span className="text-muted-foreground">Chargement…</span>
                          ) : connectionStatus?.documentCount !== undefined ? (
                            connectionStatus.documentCount === 0 ? (
                              <span
                                className="text-amber-600 dark:text-amber-400"
                                title="Documents are being synced from your account"
                              >
                                Syncing...
                              </span>
                            ) : (
                              connectionStatus.documentCount.toLocaleString()
                            )
                          ) : connection?.metadata?.pageToken ? (
                            connection.metadata.pageToken === 0 ? (
                              <span
                                className="text-amber-600 dark:text-amber-400"
                                title="Documents are being synced from your account"
                              >
                                Syncing...
                              </span>
                            ) : (
                              connection.metadata.pageToken.toLocaleString()
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dernière synchronisation :</span>
                        <div className="font-medium">
                          {isStatusLoading ? (
                            <span className="text-muted-foreground">Chargement…</span>
                          ) : connectionStatus?.lastSync || connection?.createdAt ? (
                            new Date(connectionStatus?.lastSync || connection?.createdAt).toLocaleDateString()
                          ) : (
                            <span className="text-muted-foreground">Jamais</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Limite :</span>
                        <div className="font-medium">{config.documentLimit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={cn('text-center', isMobile ? 'pt-1' : 'pt-2')}>
        <div className="flex items-center gap-2 justify-center">
          <p className={cn('text-muted-foreground', isMobile ? 'text-[10px]' : 'text-xs')}>propulsé par</p>
          <Image
            src="/supermemory.svg"
            alt="Connectors"
            className="invert dark:invert-0"
            width={isMobile ? 100 : 120}
            height={isMobile ? 100 : 120}
          />
        </div>
      </div>
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
      value: 'subscription',
      label: 'Abonnement',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={Crown02Icon} className={className} />,
    },
    {
      value: 'preferences',
      label: 'Préférences',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={Settings02Icon} className={className} />,
    },
    {
      value: 'connectors',
      label: 'Connecteurs',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={ConnectIcon} className={className} />,
    },
    {
      value: 'memories',
      label: 'Mémoires',
      icon: ({ className }: { className?: string }) => <HugeiconsIcon icon={Brain02Icon} className={className} />,
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

      <TabsContent value="subscription" className="mt-0">
        <SubscriptionSection subscriptionData={subscriptionData} isProUser={isProUser} user={user} />
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

      <TabsContent value="connectors" className="mt-0">
        <ConnectorsSection user={user} />
      </TabsContent>

      <TabsContent value="memories" className="mt-0">
        <MemoriesSection />
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
export { SubscriptionSection };
