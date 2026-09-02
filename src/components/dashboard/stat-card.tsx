import { TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  growth,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Fração (0.1 = +10%) comparada ao período anterior; omitido quando não há comparativo. */
  growth?: number | null;
}) {
  const hasGrowth = growth !== undefined && growth !== null;
  const isPositive = hasGrowth && growth >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <CardTitle>{label}</CardTitle>
        <Icon className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {hasGrowth && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {isPositive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
            {formatPercent(growth)} vs. período anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
