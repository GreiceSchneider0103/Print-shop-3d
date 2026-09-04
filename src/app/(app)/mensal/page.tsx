import Link from "next/link";
import { LineChartIcon } from "lucide-react";

import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatCurrencyBRL, formatMonth } from "@/lib/format";
import { getMonthlySeries } from "@/lib/queries/monthly";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardMensalPage() {
  const [series, revenueGoal] = await Promise.all([
    getMonthlySeries(),
    db.revenueGoal.findUnique({ where: { id: 1 } }),
  ]);
  const metaMensal = revenueGoal ? Number(revenueGoal.metaMensal) : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={LineChartIcon}
        title="Dashboard Mensal"
        description="Desde o início da operação — clique num mês para ver os pedidos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={series} metaMensal={metaMensal} />
        </CardContent>
      </Card>

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
