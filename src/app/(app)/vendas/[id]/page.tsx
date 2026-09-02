import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { getOrderById } from "@/lib/queries/orders";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrderById(Number(id));

  if (!result) notFound();

  const { order, product, cmv, margem, margemPct } = result;

  const rows: [string, string][] = [
    ["Valor total", formatCurrencyBRL(order.valorTotal.toString())],
    ["Comissão", `- ${formatCurrencyBRL(order.comissao.toString())}`],
    ["Frete cliente", `- ${formatCurrencyBRL(order.freteCliente.toString())}`],
    ["Frete empresa", `- ${formatCurrencyBRL(order.freteEmpresa.toString())}`],
    ["CMV", `- ${formatCurrencyBRL(cmv)}${product ? "" : " (SKU não cadastrado)"}`],
    ["Margem", formatCurrencyBRL(margem)],
  ];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Pedido {order.numeroPedido}</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(order.dataVenda)} · <Badge variant="outline">{order.canal}</Badge>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">SKU</span>
          <span className="font-mono">{order.sku}</span>
          <span className="text-muted-foreground">Produto</span>
          <span>{order.produto}</span>
          <span className="text-muted-foreground">Quantidade</span>
          <span>{order.quantidade}</span>
          <span className="text-muted-foreground">Cliente</span>
          <span>{order.clienteNome ?? "—"}</span>
          <span className="text-muted-foreground">UF</span>
          <span>{order.uf ?? "—"}</span>
          <span className="text-muted-foreground">Situação</span>
          <span>{order.situacao}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breakdown financeiro</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b py-1 last:border-0 last:font-semibold">
              <span className="text-muted-foreground">{label}</span>
              <span>{value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>Margem %</span>
            <span>{(margemPct * 100).toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
