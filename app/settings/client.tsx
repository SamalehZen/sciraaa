"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCachedUserData } from "@/hooks/use-cached-user-data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  getExtremeSearchUsageCount,
  getHistoricalUsage,
  getSubDetails,
  getUserMessageCount,
} from "@/app/actions";
import { SEARCH_LIMITS } from "@/lib/constants";
import { MagnifyingGlassIcon, LightningIcon, SignOutIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { AnimatedProgress } from "@/components/settings/animated-progress";
import { MetricCard } from "@/components/settings/metric-card";
import { SettingsHeatmap } from "@/components/settings/heatmap";
import {
  PreferencesSection,
  SubscriptionSection,
  ConnectorsSection,
  MemoriesSection,
} from "@/components/settings-dialog";
import { MessageSquare, Settings } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";

function ProfileSection({ user }: { user: any }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [blurPersonalInfo, setBlurPersonalInfo] = useLocalStorage<boolean>("scira-blur-personal-info", false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className={cn("h-16 w-16", blurPersonalInfo && "blur-sm")}>
          <AvatarImage src={user?.image || ""} alt={user?.name} />
          <AvatarFallback>
            {user?.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold text-lg truncate", blurPersonalInfo && "blur-sm")}>
            {user?.name}
          </h3>
          <p className={cn("text-sm text-muted-foreground truncate", blurPersonalInfo && "blur-sm")}>
            {user?.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBlurPersonalInfo(!blurPersonalInfo)}
          className="flex-1"
        >
          {blurPersonalInfo ? "Afficher infos" : "Flouter infos"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() =>
            signOut({
              fetchOptions: {
                onRequest: () => toast.loading("Déconnexion..."),
                onSuccess: () => {
                  toast.success("Déconnecté");
                  toast.dismiss();
                  localStorage.clear();
                  window.location.href = "/new";
                },
                onError: () => {
                  toast.error("Erreur");
                  window.location.reload();
                },
              },
            })
          }
        >
          <SignOutIcon className="h-4 w-4 mr-1" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}

function UsagePageSection({ user }: { user: any }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const monthsWindow = isMobile ? 6 : 12;

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["usageData", user?.id],
    queryFn: async () => {
      const [searchCount, extremeSearchCount] = await Promise.all([
        getUserMessageCount(),
        getExtremeSearchUsageCount(),
      ]);
      return { searchCount, extremeSearchCount };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 3,
  });

  const { data: historicalUsageData, isLoading: historicalLoading } = useQuery({
    queryKey: ["historicalUsagePage", user?.id, monthsWindow],
    queryFn: () => getHistoricalUsage(user, monthsWindow),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  const todayCount = usageData?.searchCount?.count || 0;
  const extremeMonthCount = usageData?.extremeSearchCount?.count || 0;
  const dailyLimit = SEARCH_LIMITS.DAILY_SEARCH_LIMIT;
  const percent = Math.min((todayCount / dailyLimit) * 100, 100);

  const placeholder = useMemo(() => [], []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="text-muted-foreground text-sm mb-4">Suivi des recherches quotidiennes et mensuelles</div>
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <MetricCard
            title="Aujourd'hui"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            value={usageLoading ? "—" : todayCount}
            subtitle="Recherches régulières"
          />
          <MetricCard
            title="Extrême"
            icon={<LightningIcon className="h-4 w-4" />}
            value={usageLoading ? "—" : extremeMonthCount}
            subtitle="Ce mois"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Limite quotidienne</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <AnimatedProgress value={percent} />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
            <span>
              {todayCount}/{dailyLimit}
            </span>
            <span>{Math.max(0, dailyLimit - todayCount)} restant</span>
          </div>
        </div>
      </div>

      <SettingsHeatmap data={historicalLoading ? placeholder : historicalUsageData || []} />
    </div>
  );
}

export default function SettingsPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as string | null;
  const [tab, setTab] = useState<string>(tabParam || "profile");
  const { user, isProUser } = useCachedUserData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-6 py-8 sm:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/new" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau chat</span>
              </Link>
            </Button>
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="icon">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div />
          <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
            Lien vers offres
          </Link>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted border border-border rounded-lg p-1 grid grid-cols-2 sm:grid-cols-6 gap-1 w-full">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Profil
            </TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Usage
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden sm:block">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden sm:block">
              Preferences
            </TabsTrigger>
            <TabsTrigger value="connectors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden sm:block">
              Connectors
            </TabsTrigger>
            <TabsTrigger value="memories" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hidden sm:block">
              Memories
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-6">
            <TabsContent value="profile" className="m-0">
              <div className="rounded-xl bg-card border border-border p-6">
                <ProfileSection user={user} />
              </div>
            </TabsContent>

            <TabsContent value="usage" className="m-0">
              <UsagePageSection user={user} />
            </TabsContent>

            <TabsContent value="subscription" className="m-0">
              <div className="rounded-xl bg-card border border-border p-6">
                <SubscriptionSection subscriptionData={null} isProUser={isProUser} user={user} />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="m-0">
              <div className="rounded-xl bg-card border border-border p-6">
                <PreferencesSection user={user} />
              </div>
            </TabsContent>

            <TabsContent value="connectors" className="m-0">
              <div className="rounded-xl bg-card border border-border p-6">
                <ConnectorsSection user={user} />
              </div>
            </TabsContent>

            <TabsContent value="memories" className="m-0">
              <div className="rounded-xl bg-card border border-border p-6">
                <MemoriesSection />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
