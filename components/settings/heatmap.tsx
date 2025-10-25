"use client";

import { cn } from "@/lib/utils";
import {
  ContributionGraph,
  ContributionGraphCalendar,
  ContributionGraphBlock,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from "@/components/ui/kibo-ui/contribution-graph";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function SettingsHeatmap({
  data,
  loading,
  blockSize = 12,
}: {
  data: Activity[];
  loading?: boolean;
  blockSize?: number;
}) {
  const labels = {
    months: MONTHS_FR,
    totalCount: "{{count}} activités en {{year}}",
    legend: { less: "Moins", more: "Plus" },
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <h4 className="text-foreground text-sm font-semibold mb-2">Activité (12 derniers mois)</h4>
      <TooltipProvider>
        <ContributionGraph
          data={data}
          blockSize={blockSize}
          blockMargin={2}
          fontSize={12}
          labels={labels}
          className="w-full"
        >
          <ContributionGraphCalendar className="text-muted-foreground text-xs">
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
                        'data-[level="1"]:fill-primary/30',
                        'data-[level="2"]:fill-primary/50',
                        'data-[level="3"]:fill-primary/70',
                        'data-[level="4"]:fill-primary'
                      )}
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">
                      {activity.count} {activity.count === 1 ? 'activité' : 'activités'}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
          <ContributionGraphFooter className="pt-2 gap-2 items-center">
            <ContributionGraphTotalCount className="text-muted-foreground text-xs" />
            <ContributionGraphLegend className="text-muted-foreground">
              {({ level }) => (
                <svg height={10} width={10}>
                  <rect
                    className={cn(
                      'stroke-[1px] stroke-border',
                      'data-[level="0"]:fill-muted',
                      'data-[level="1"]:fill-primary/30',
                      'data-[level="2"]:fill-primary/50',
                      'data-[level="3"]:fill-primary/70',
                      'data-[level="4"]:fill-primary'
                    )}
                    data-level={level}
                    height={10}
                    rx={2}
                    ry={2}
                    width={10}
                  />
                </svg>
              )}
            </ContributionGraphLegend>
          </ContributionGraphFooter>
        </ContributionGraph>
      </TooltipProvider>
    </div>
  );
}
