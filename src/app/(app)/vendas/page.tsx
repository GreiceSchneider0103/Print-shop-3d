import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrdersFilter } from "@/components/vendas/orders-filter";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { listOrders, type OrderFilters } from "@/lib/queries/orders";

const PROBLEM_SITUATIONS = ["cancelado", "cancelada", "reembolsado", "reembolsada", "devolvido", "devolvida"];

export const dynamic = "force-dynamic";

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<OrderFilters & { page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { orders, total, totalPages, canais, situacoes } = await listOrders(params, page);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Vendas / Pedidos</h1>
        <p className="text-sm text-muted-foreground">{total} pedido(s) encontrados</p>
      </div>

      <OrdersFilter filters={params} canais={canais} situacoes={situacoes} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Margem</TableHead>
            <TableHead>Situação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(({ order, margem }) => {
            const isProblem = PROBLEM_SITUATIONS.some((s) =>
              order.situacao.toLowerCase().includes(s),
            );

            return (
              <TableRow key={order.id}>
                <TableCell>
                  <Link href={`/vendas/${order.id}`} className="text-primary hover:underline">
                    {order.numeroPedido}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(order.dataVenda)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{order.canal}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{order.sku}</TableCell>
                <TableCell>{order.produto}</TableCell>
                <TableCell>{order.quantidade}</TableCell>
                <TableCell>{formatCurrencyBRL(order.valorTotal.toString())}</TableCell>
                <TableCell>{formatCurrencyBRL(margem)}</TableCell>
                <TableCell>
                  <Badge variant={isProblem ? "destructive" : "secondary"}>{order.situacao}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                Nenhum pedido encontrado para os filtros selecionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </div>
      )}
    </div>
  );
}
