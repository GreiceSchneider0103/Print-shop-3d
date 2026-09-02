import { PeriodFilter } from "@/components/dashboard/period-filter";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import { getDateRangeFromSearchParams, getPreviousRange, growthPct, toInputDate } from "@/lib/period";
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

  const [current, previous] = await Promise.all([
    getDashboardData(range),
    getDashboardData(previousRange),
  ]);

  const faturamentoGrowth = growthPct(current.faturamentoTotal, previous.faturamentoTotal);
  const margemGrowth = growthPct(current.margemTotal, previous.margemTotal);
  const pedidosGrowth = growthPct(current.numPedidos, previous.numPedidos);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard Geral</h1>
          <p className="text-sm text-muted-foreground">
            {toInputDate(range.from)} até {toInputDate(range.to)} — comparado ao período anterior
            equivalente
          </p>
        </div>
        <PeriodFilter from={toInputDate(range.from)} to={toInputDate(range.to)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Faturamento total"
          value={formatCurrencyBRL(current.faturamentoTotal)}
          hint={faturamentoGrowth !== null ? `${formatPercent(faturamentoGrowth)} vs. período anterior` : undefined}
          hintTone={faturamentoGrowth !== null && faturamentoGrowth >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Margem"
          value={`${formatCurrencyBRL(current.margemTotal)} (${formatPercent(current.margemPct)})`}
          hint={margemGrowth !== null ? `${formatPercent(margemGrowth)} vs. período anterior` : undefined}
          hintTone={margemGrowth !== null && margemGrowth >= 0 ? "positive" : "negative"}
        />
        <StatCard
          label="Nº de pedidos"
          value={String(current.numPedidos)}
          hint={pedidosGrowth !== null ? `${formatPercent(pedidosGrowth)} vs. período anterior` : undefined}
          hintTone={pedidosGrowth !== null && pedidosGrowth >= 0 ? "positive" : "negative"}
        />
        <StatCard label="Ticket médio" value={formatCurrencyBRL(current.ticketMedio)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Faturamento e margem por canal</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <Badge variant="outline">{c.canal}</Badge>
                    </TableCell>
                    <TableCell>{c.pedidos}</TableCell>
                    <TableCell>{formatCurrencyBRL(c.faturamento)}</TableCell>
                    <TableCell>{formatCurrencyBRL(c.margem)}</TableCell>
                  </TableRow>
                ))}
                {current.porCanal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum pedido no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top produtos por margem</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <TableCell>{p.produto}</TableCell>
                    <TableCell>{formatCurrencyBRL(p.margem)}</TableCell>
                  </TableRow>
                ))}
                {current.topPorMargem.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum pedido no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
