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
      <div>
        <h1 className="text-xl font-semibold">Análise por Produto</h1>
        <p className="text-sm text-muted-foreground">
          Curva ABC por margem (histórico completo) — classe A = SKUs que juntos somam 80% da margem
        </p>
      </div>

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
              <TableCell>{p.produto}</TableCell>
              <TableCell>{p.quantidade}</TableCell>
              <TableCell>{formatCurrencyBRL(p.faturamento)}</TableCell>
              <TableCell>{formatCurrencyBRL(p.margem)}</TableCell>
              <TableCell>{formatPercent(p.margemPct)}</TableCell>
              <TableCell>{formatPercent(p.cumulativoPct)}</TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Nenhum pedido sincronizado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
