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
    <div className="rounded-xl bg-[#2a2a2a] p-4">
      <h4 className="text-white text-sm font-semibold mb-2">Activité (12 derniers mois)</h4>
      <TooltipProvider>
        <ContributionGraph
          data={data}
          blockSize={blockSize}
          blockMargin={2}
          fontSize={12}
          labels={labels}
          className="w-full"
        >
          <ContributionGraphCalendar className="text-[#a0a0a0] text-xs">
            {({ activity, dayIndex, weekIndex }) => (
              <Tooltip key={`${weekIndex}-${dayIndex}`}>
                <TooltipTrigger asChild>
                  <g className="cursor-help">
                    <ContributionGraphBlock
                      activity={activity}
                      dayIndex={dayIndex}
                      weekIndex={weekIndex}
                      className={cn(
                        'data-[level="0"]:fill-[#1e1e1e]',
                        'data-[level="1"]:fill-[#315d1a]',
                        'data-[level="2"]:fill-[#4f8a28]',
                        'data-[level="3"]:fill-[#66a430]',
                        'data-[level="4"]:fill-[#7CB342]'
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
            <ContributionGraphTotalCount className="text-[#a0a0a0] text-xs" />
            <ContributionGraphLegend className="text-[#a0a0a0]">
              {({ level }) => (
                <svg height={10} width={10}>
                  <rect
                    className={cn(
                      'stroke-[1px] stroke-[#333333]',
                      'data-[level="0"]:fill-[#1e1e1e]',
                      'data-[level="1"]:fill-[#315d1a]',
                      'data-[level="2"]:fill-[#4f8a28]',
                      'data-[level="3"]:fill-[#66a430]',
                      'data-[level="4"]:fill-[#7CB342]'
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
