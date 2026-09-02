import Link from "next/link";
import { LineChartIcon } from "lucide-react";

import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatMonth } from "@/lib/format";
import { getMonthlySeries } from "@/lib/queries/monthly";

export const dynamic = "force-dynamic";

export default async function DashboardMensalPage() {
  const series = await getMonthlySeries(12);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={LineChartIcon}
        title="Dashboard Mensal"
        description="Últimos 12 meses — clique num mês para ver os pedidos"
      />

      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={series} />
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
                <TableHead>Faturamento</TableHead>
                <TableHead>Margem</TableHead>
                <TableHead>Custos fixos</TableHead>
                <TableHead>Lucro líquido</TableHead>
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
                  <TableCell>{formatCurrencyBRL(point.faturamento)}</TableCell>
                  <TableCell className={point.margem < 0 ? "text-destructive" : undefined}>
                    {formatCurrencyBRL(point.margem)}
                  </TableCell>
                  <TableCell>{formatCurrencyBRL(point.custosFixos)}</TableCell>
                  <TableCell className={point.lucroLiquido < 0 ? "text-destructive font-medium" : "font-medium"}>
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
