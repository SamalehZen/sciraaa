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
import { MessageSquare, Settings, Menu } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { toast } from "sonner";

function ProfileSection({ user }: { user: any }) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [blurPersonalInfo, setBlurPersonalInfo] = useLocalStorage<boolean>("scira-blur-personal-info", false);

  return (
    <div className={cn("space-y-4", isMobile ? "space-y-3" : "space-y-4")}>
      <div className={cn("flex items-center gap-4", isMobile && "gap-3")}>
        <Avatar className={cn("h-16 w-16 shrink-0", isMobile && "h-14 w-14", blurPersonalInfo && "blur-sm")}>
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
          <h3 className={cn("font-semibold truncate", isMobile ? "text-base" : "text-lg", blurPersonalInfo && "blur-sm")}>
            {user?.name}
          </h3>
          <p className={cn("text-muted-foreground truncate", isMobile ? "text-xs" : "text-sm", blurPersonalInfo && "blur-sm")}>
            {user?.email}
          </p>
        </div>
      </div>

      <div className={cn("flex flex-col gap-2", isMobile && "gap-2")}>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={() => setBlurPersonalInfo(!blurPersonalInfo)}
          className="w-full"
        >
          {blurPersonalInfo ? "Afficher infos" : "Flouter infos"}
        </Button>
        <Button
          variant="outline"
          size={isMobile ? "sm" : "default"}
          className="w-full text-destructive hover:text-destructive"
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
          <SignOutIcon className={cn("mr-1.5", isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className={isMobile ? "text-xs" : "text-sm"}>Déconnexion</span>
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
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      <div className={cn("rounded-xl bg-card border border-border", isMobile ? "p-4" : "p-6")}>
        <div className={cn("text-muted-foreground mb-4", isMobile ? "text-xs" : "text-sm")}>
          Suivi des recherches quotidiennes et mensuelles
        </div>
        <div className={cn("grid gap-4", isMobile ? "gap-3 grid-cols-2" : "gap-4 grid-cols-2")}>
          <MetricCard
            title="Aujourd'hui"
            icon={<MagnifyingGlassIcon className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />}
            value={usageLoading ? "—" : todayCount}
            subtitle="Recherches régulières"
          />
          <MetricCard
            title="Extrême"
            icon={<LightningIcon className={cn(isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />}
            value={usageLoading ? "—" : extremeMonthCount}
            subtitle="Ce mois"
          />
        </div>

        <div className={cn("mt-6", isMobile && "mt-4")}>
          <div className={cn("flex items-center justify-between mb-2", isMobile ? "text-[10px]" : "text-xs", "text-muted-foreground")}>
            <span>Limite quotidienne</span>
            <span>{Math.round(percent)}%</span>
          </div>
          <AnimatedProgress value={percent} />
          <div className={cn("flex items-center justify-between mt-1.5", isMobile ? "text-[10px]" : "text-[11px]", "text-muted-foreground")}>
            <span>
              {todayCount}/{dailyLimit}
            </span>
            <span>{Math.max(0, dailyLimit - todayCount)} restant</span>
          </div>
        </div>
      </div>

      <SettingsHeatmap data={historicalLoading ? placeholder : historicalUsageData || []} blockSize={isMobile ? 8 : 12} />
    </div>
  );
}

const TabsConfig = [
  { value: "profile", label: "Profil", show: true },
  { value: "usage", label: "Usage", show: true },
  { value: "subscription", label: "Sub", labelFull: "Subscription", show: true },
  { value: "preferences", label: "Prefs", labelFull: "Preferences", show: true },
  { value: "connectors", label: "Conn", labelFull: "Connectors", show: true },
  { value: "memories", label: "Mem", labelFull: "Memories", show: true },
];

export default function SettingsPageClient() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as string | null;
  const [tab, setTab] = useState<string>(tabParam || "profile");
  const { user, isProUser } = useCachedUserData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className={cn("sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border", isMobile ? "px-4 py-4" : "px-6 sm:px-8 py-6")}>
        <div className="max-w-5xl mx-auto">
          <div className={cn("flex items-center justify-between", isMobile && "gap-2")}>
            <h1 className={cn("font-bold", isMobile ? "text-xl" : "text-3xl")}>Paramètres</h1>
            <div className={cn("flex items-center gap-1", isMobile && "gap-1.5")}>
              {!isMobile && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/new" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Nouveau chat</span>
                  </Link>
                </Button>
              )}
              <ThemeSwitcher />
              <Button asChild variant="ghost" size={isMobile ? "icon" : "icon"} className={isMobile ? "h-9 w-9" : ""}>
                <Link href="/settings">
                  <Settings className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                </Link>
              </Button>
            </div>
          </div>

          {isMobile && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div />
              <Link href="/pricing" className="text-xs text-primary hover:underline font-medium">
                Offres
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("max-w-5xl mx-auto", isMobile ? "px-4 py-4" : "px-6 sm:px-8 py-8")}>
        {!isMobile && (
          <div className={cn("flex items-center justify-between mb-6", isMobile && "mb-4")}>
            <div />
            <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
              Lien vers offres
            </Link>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          {/* Tabs Navigation */}
          <TabsList className={cn(
            "bg-muted border border-border rounded-lg p-1 w-full",
            isMobile ? "grid grid-cols-3 gap-1 h-auto p-1" : "grid grid-cols-6 gap-1 p-1"
          )}>
            {TabsConfig.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded transition-colors",
                  isMobile ? "text-xs px-2 py-2 h-auto" : "text-sm px-2 py-2 h-auto"
                )}
              >
                {isMobile ? t.label : t.labelFull || t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tabs Content */}
          <div className={cn("mt-6 space-y-6", isMobile && "mt-4 space-y-4")}>
            <TabsContent value="profile" className="m-0">
              <div className={cn("rounded-xl bg-card border border-border", isMobile ? "p-4" : "p-6")}>
                <ProfileSection user={user} />
              </div>
            </TabsContent>

            <TabsContent value="usage" className="m-0">
              <UsagePageSection user={user} />
            </TabsContent>

            <TabsContent value="subscription" className="m-0">
              <div className={cn("rounded-xl bg-card border border-border overflow-hidden", isMobile ? "p-4" : "p-6")}>
                <div className={cn("overflow-y-auto", isMobile && "max-h-[60vh]")}>
                  <SubscriptionSection subscriptionData={null} isProUser={isProUser} user={user} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="m-0">
              <div className={cn("rounded-xl bg-card border border-border overflow-hidden", isMobile ? "p-4" : "p-6")}>
                <div className={cn("overflow-y-auto", isMobile && "max-h-[60vh]")}>
                  <PreferencesSection user={user} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="connectors" className="m-0">
              <div className={cn("rounded-xl bg-card border border-border overflow-hidden", isMobile ? "p-4" : "p-6")}>
                <div className={cn("overflow-y-auto", isMobile && "max-h-[60vh]")}>
                  <ConnectorsSection user={user} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="memories" className="m-0">
              <div className={cn("rounded-xl bg-card border border-border overflow-hidden", isMobile ? "p-4" : "p-6")}>
                <div className={cn("overflow-y-auto", isMobile && "max-h-[60vh]")}>
                  <MemoriesSection />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
