"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useCachedUserData } from "@/hooks/use-cached-user-data";
import {
  getExtremeSearchUsageCount,
  getHistoricalUsage,
  getSubDetails,
  getUserMessageCount,
} from "@/app/actions";
import { SEARCH_LIMITS } from "@/lib/constants";
import { MagnifyingGlassIcon, LightningIcon } from "@phosphor-icons/react";
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
      <div className="rounded-xl bg-[#2a2a2a] p-6">
        <div className="text-[#a0a0a0] text-sm mb-4">Suivi des recherches quotidiennes et mensuelles</div>
        <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}
        >
          <MetricCard
            title="Aujourd'hui"
            icon={<MagnifyingGlassIcon className="h-4 w-4" />}
            value={usageLoading ? "—" : todayCount}
            subtitle="Recherches régulières"
            className="bg-[#1e1e1e]"
          />
          <MetricCard
            title="Extrême"
            icon={<LightningIcon className="h-4 w-4" />}
            value={usageLoading ? "—" : extremeMonthCount}
            subtitle="Ce mois"
            className="bg-[#1e1e1e]"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-[#a0a0a0] mb-2">
            <span>Limite quotidienne</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <AnimatedProgress value={percent} />
          <div className="flex items-center justify-between text-[11px] text-[#a0a0a0] mt-1.5">
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
  const [tab, setTab] = useState<string>(tabParam || "usage");
  const { user, isProUser } = useCachedUserData();

  return (
    <div className="min-h-[100dvh] bg-[#121212] text-white">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="bg-[#2a2a2a] border border-[#333333] text-white">
              <Link href="/new" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Nouveau chat
              </Link>
            </Button>
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="icon" className="text-white/80 hover:text-white">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div />
          <Link href="/pricing" className="text-sm text-[#F5DEB3] hover:underline">
            Lien vers offres
          </Link>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#1e1e1e] border border-[#333333] rounded-lg p-1 grid grid-cols-5 gap-1 w-full">
            <TabsTrigger value="usage" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Usage
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Preferences
            </TabsTrigger>
            <TabsTrigger value="connectors" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Connectors
            </TabsTrigger>
            <TabsTrigger value="memories" className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-white">
              Memories
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-6">
            <TabsContent value="usage" className="m-0">
              <UsagePageSection user={user} />
            </TabsContent>
            <TabsContent value="subscription" className="m-0">
              <div className="rounded-xl bg-[#2a2a2a] p-6">
                <SubscriptionSection subscriptionData={null} isProUser={isProUser} user={user} />
              </div>
            </TabsContent>
            <TabsContent value="preferences" className="m-0">
              <div className="rounded-xl bg-[#2a2a2a] p-6">
                <PreferencesSection user={user} />
              </div>
            </TabsContent>
            <TabsContent value="connectors" className="m-0">
              <div className="rounded-xl bg-[#2a2a2a] p-6">
                <ConnectorsSection user={user} />
              </div>
            </TabsContent>
            <TabsContent value="memories" className="m-0">
              <div className="rounded-xl bg-[#2a2a2a] p-6">
                <MemoriesSection />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
