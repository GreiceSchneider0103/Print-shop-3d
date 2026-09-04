import type { ReactNode } from "react";
import { TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  growth,
  growthLabel = "período anterior",
  footer,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Fração (0.1 = +10%) comparada ao período de referência; omitido quando não há comparativo. */
  growth?: number | null;
  growthLabel?: string;
  /** Linha extra abaixo do crescimento — pra métrica secundária relacionada (ex: ticket médio junto de nº de pedidos). */
  footer?: ReactNode;
}) {
  const hasGrowth = growth !== undefined && growth !== null;
  const isPositive = hasGrowth && growth >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-xs">{label}</CardTitle>
        <Icon className="text-muted-foreground size-3.5 shrink-0" />
      </CardHeader>
      <CardContent className="pt-1.5">
        <div className="text-xl font-semibold tracking-tight">{value}</div>
        {hasGrowth && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {isPositive ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
            {formatPercent(growth)} vs. {growthLabel}
          </p>
        )}
        {footer && <p className="text-muted-foreground mt-1 text-xs">{footer}</p>}
      </CardContent>
    </Card>
  );
}
