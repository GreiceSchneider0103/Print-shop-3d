import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
        <Link
          href="/vendas"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-3.5" />
          Voltar para Vendas
        </Link>
        <h1 className="text-xl font-semibold">Pedido {order.numeroPedido}</h1>
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          {formatDate(order.dataVenda)} <ChannelBadge canal={order.canal} />
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
          {rows.map(([label, value], index) => {
            const isLast = index === rows.length - 1;
            return (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between border-b py-1 last:border-0 last:font-semibold",
                  isLast && margem < 0 && "text-destructive",
                )}
              >
                <span className={cn("text-muted-foreground", isLast && "font-semibold text-inherit")}>{label}</span>
                <span>{value}</span>
              </div>
            );
          })}
          <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
            <span>Margem %</span>
            <span>{(margemPct * 100).toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
