import { CalendarClockIcon, LayoutDashboardIcon, PackageIcon, ReceiptTextIcon, ShoppingCartIcon, WalletIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import {
  getDateRangeFromSearchParams,
  getPreviousRange,
  getTodayRange,
  getYesterdayRange,
  growthPct,
  toInputDate,
} from "@/lib/period";
import { getDashboardData } from "@/lib/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardGeralPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = getDateRangeFromSearchParams(params);
  const previousRange = getPreviousRange(range);

  const [current, previous, hoje, ontem] = await Promise.all([
    getDashboardData(range),
    getDashboardData(previousRange),
    getDashboardData(getTodayRange()),
    getDashboardData(getYesterdayRange()),
  ]);

  const faturamentoGrowth = growthPct(current.faturamentoTotal, previous.faturamentoTotal);
  const margemGrowth = growthPct(current.margemTotal, previous.margemTotal);
  const pedidosGrowth = growthPct(current.numPedidos, previous.numPedidos);
  const faturamentoDiaGrowth = growthPct(hoje.faturamentoTotal, ontem.faturamentoTotal);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LayoutDashboardIcon}
        title="Dashboard Geral"
        description={`${toInputDate(range.from)} até ${toInputDate(range.to)} — comparado ao período anterior equivalente`}
        actions={<PeriodFilter from={toInputDate(range.from)} to={toInputDate(range.to)} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={WalletIcon}
          label="Faturamento total"
          value={formatCurrencyBRL(current.faturamentoTotal)}
          growth={faturamentoGrowth}
        />
        <StatCard
          icon={ReceiptTextIcon}
          label="Margem"
          value={`${formatCurrencyBRL(current.margemTotal)} (${formatPercent(current.margemPct)})`}
          growth={margemGrowth}
        />
        <StatCard
          icon={ShoppingCartIcon}
          label="Nº de pedidos"
          value={String(current.numPedidos)}
          growth={pedidosGrowth}
        />
        <StatCard icon={PackageIcon} label="Ticket médio" value={formatCurrencyBRL(current.ticketMedio)} />
        <StatCard
          icon={CalendarClockIcon}
          label="Faturamento do dia"
          value={formatCurrencyBRL(hoje.faturamentoTotal)}
          growth={faturamentoDiaGrowth}
          growthLabel="ontem"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento e margem por canal</CardTitle>
          </CardHeader>
          <CardContent>
            {current.porCanal.length === 0 ? (
              <EmptyState icon={ShoppingCartIcon} message="Nenhum pedido no período." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.porCanal.map((c) => (
                    <TableRow key={c.canal}>
                      <TableCell>
                        <ChannelBadge canal={c.canal} />
                      </TableCell>
                      <TableCell>{c.pedidos}</TableCell>
                      <TableCell>{formatCurrencyBRL(c.faturamento)}</TableCell>
                      <TableCell className={c.margem < 0 ? "text-destructive" : undefined}>
                        {formatCurrencyBRL(c.margem)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produtos por margem</CardTitle>
          </CardHeader>
          <CardContent>
            {current.topPorMargem.length === 0 ? (
              <EmptyState icon={PackageIcon} message="Nenhum pedido no período." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {current.topPorMargem.map((p) => (
                    <TableRow key={p.sku}>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{p.produto}</TableCell>
                      <TableCell className={p.margem < 0 ? "text-destructive" : undefined}>
                        {formatCurrencyBRL(p.margem)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
