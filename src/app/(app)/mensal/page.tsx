import Link from "next/link";

import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL } from "@/lib/format";
import { getMonthlySeries } from "@/lib/queries/monthly";

export const dynamic = "force-dynamic";

export default async function DashboardMensalPage() {
  const series = await getMonthlySeries(12);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard Mensal</h1>
        <p className="text-sm text-muted-foreground">Últimos 12 meses — clique num mês para ver os pedidos</p>
      </div>

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
                    <Link href={`/vendas?from=${point.month}-01&to=${point.month}-31`} className="text-primary hover:underline">
                      {point.month}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrencyBRL(point.faturamento)}</TableCell>
                  <TableCell>{formatCurrencyBRL(point.margem)}</TableCell>
                  <TableCell>{formatCurrencyBRL(point.custosFixos)}</TableCell>
                  <TableCell>{formatCurrencyBRL(point.lucroLiquido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
