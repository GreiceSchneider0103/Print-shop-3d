import Link from "next/link";
import { LineChartIcon } from "lucide-react";

import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatMonth } from "@/lib/format";
import { getCurrentMonthProjection, getMonthlySeries } from "@/lib/queries/monthly";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardMensalPage() {
  const [series, revenueGoal, projection] = await Promise.all([
    getMonthlySeries(),
    db.revenueGoal.findUnique({ where: { id: 1 } }),
    getCurrentMonthProjection(),
  ]);
  const metaMensal = revenueGoal ? Number(revenueGoal.metaMensal) : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={LineChartIcon}
        title="Dashboard Mensal"
        description="Desde o início da operação — clique num mês para ver os pedidos"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart data={series} metaMensal={metaMensal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projeção{projection ? ` — ${formatMonth(`${projection.month}-01`)}` : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            {projection ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Faturamento líquido projetado</span>
                  <span className="text-xl font-semibold">
                    {formatCurrencyBRL(projection.faturamentoLiquidoProjetado)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">Margem líquida projetada</span>
                  <span
                    className={cn(
                      "text-xl font-semibold",
                      projection.margemLiquidaProjetada < 0 && "text-destructive",
                    )}
                  >
                    {formatCurrencyBRL(projection.margemLiquidaProjetada)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Baseado no ritmo dos primeiros {projection.diasDecorridos} de {projection.diasNoMes} dias do mês.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhum pedido registrado neste mês ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Custos fixos</TableHead>
                <TableHead className="text-right">Lucro líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((point) => (
                <TableRow key={point.month}>
                  <TableCell>
                    <Link
                      href={`/vendas?from=${point.month}-01&to=${point.month}-31`}
                      className="text-primary hover:underline"
                    >
                      {formatMonth(`${point.month}-01`)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(point.faturamento)}</TableCell>
                  <TableCell className={cn("text-right", point.margem < 0 && "text-destructive")}>
                    {formatCurrencyBRL(point.margem)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(point.custosFixos)}</TableCell>
                  <TableCell
                    className={cn("text-right font-medium", point.lucroLiquido < 0 && "text-destructive")}
                  >
                    {formatCurrencyBRL(point.lucroLiquido)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
