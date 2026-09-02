import { PackageIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import { getProductAnalysis } from "@/lib/queries/products";

const CLASSE_VARIANT = {
  A: "success",
  B: "warning",
  C: "secondary",
} as const;

export const dynamic = "force-dynamic";

export default async function AnaliseProdutoPage() {
  const products = await getProductAnalysis();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={PackageIcon}
        title="Análise por Produto"
        description="Curva ABC por margem (histórico completo) — classe A = SKUs que juntos somam 80% da margem"
      />

      {products.length === 0 ? (
        <EmptyState icon={PackageIcon} message="Nenhum pedido sincronizado ainda." />
      ) : (
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
      )}
    </div>
  );
}
