import { PackageIcon } from "lucide-react";

import { PeriodFilter } from "@/components/dashboard/period-filter";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ParetoChart } from "@/components/produtos/pareto-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import { getDateRangeFromSearchParams, toInputDate } from "@/lib/period";
import { getProductAnalysis } from "@/lib/queries/products";

const CLASSE_VARIANT = {
  A: "success",
  B: "warning",
  C: "secondary",
} as const;

export const dynamic = "force-dynamic";

export default async function AnaliseProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = getDateRangeFromSearchParams(params);
  const products = await getProductAnalysis(range);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={PackageIcon}
        title="Análise por Produto"
        description={`Curva ABC por margem — ${toInputDate(range.from)} até ${toInputDate(range.to)}`}
        actions={<PeriodFilter from={toInputDate(range.from)} to={toInputDate(range.to)} />}
      />

      {products.length === 0 ? (
        <EmptyState icon={PackageIcon} message="Nenhum pedido no período." />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Top 15 por margem</CardTitle>
            </CardHeader>
            <CardContent>
              <ParetoChart data={products} />
            </CardContent>
          </Card>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd. vendida</TableHead>
                <TableHead>Faturamento</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Margem %</TableHead>
                <TableHead>Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.sku}>
                  <TableCell>
                    <Badge variant={CLASSE_VARIANT[p.classe]}>{p.classe}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{p.produto}</TableCell>
                  <TableCell>{p.quantidade}</TableCell>
                  <TableCell>{formatCurrencyBRL(p.faturamento)}</TableCell>
                  <TableCell className={p.margem < 0 ? "text-destructive" : undefined}>
                    {formatCurrencyBRL(p.margem)}
                  </TableCell>
                  <TableCell>{formatPercent(p.margemPct)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatPercent(p.cumulativoPct)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
