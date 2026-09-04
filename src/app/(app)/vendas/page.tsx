import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, ShoppingCartIcon } from "lucide-react";

import { ChannelBadge } from "@/components/channel-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrdersFilter } from "@/components/vendas/orders-filter";
import { formatCurrencyBRL, formatDate } from "@/lib/format";
import { listOrders, type OrderFilters } from "@/lib/queries/orders";
import { cn } from "@/lib/utils";

const PROBLEM_SITUATIONS = ["cancelado", "cancelada", "reembolsado", "reembolsada", "devolvido", "devolvida"];

export const dynamic = "force-dynamic";

function pageHref(params: OrderFilters & { page?: string }, page: number) {
  const search = new URLSearchParams();
  if (params.canal) search.set("canal", params.canal);
  if (params.situacao) search.set("situacao", params.situacao);
  if (params.sku) search.set("sku", params.sku);
  if (params.uf) search.set("uf", params.uf);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  search.set("page", String(page));
  return `/vendas?${search.toString()}`;
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<OrderFilters & { page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 1) || 1;
  const { orders, total, totalPages, canais, situacoes } = await listOrders(params, page);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        icon={ShoppingCartIcon}
        title="Vendas / Pedidos"
        description={`${total} pedido(s) encontrado(s)`}
      />

      <OrdersFilter filters={params} canais={canais} situacoes={situacoes} />

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingCartIcon} message="Nenhum pedido encontrado para os filtros selecionados." />
      ) : (
        <Table>
          <TableHeader className="bg-card sticky top-0 z-10">
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(({ order, margem }) => {
              const isProblem = PROBLEM_SITUATIONS.some((s) => order.situacao.toLowerCase().includes(s));

              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/vendas/${order.id}`} className="text-primary font-medium hover:underline">
                      {order.numeroPedido}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(order.dataVenda)}</TableCell>
                  <TableCell>
                    <ChannelBadge canal={order.canal} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{order.sku}</TableCell>
                  <TableCell className="max-w-[240px] truncate">{order.produto}</TableCell>
                  <TableCell className="text-right">{order.quantidade}</TableCell>
                  <TableCell className="text-right">{formatCurrencyBRL(order.valorTotal.toString())}</TableCell>
                  <TableCell className={cn("text-right", margem < 0 && "text-destructive")}>
                    {formatCurrencyBRL(margem)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isProblem ? "destructive" : "success"}>{order.situacao}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={pageHref(params, page - 1)}>
                <ChevronLeftIcon />
                Anterior
              </Link>
            ) : (
              <span>
                <ChevronLeftIcon />
                Anterior
              </span>
            )}
          </Button>
          <span className="text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
            {page < totalPages ? (
              <Link href={pageHref(params, page + 1)}>
                Próxima
                <ChevronRightIcon />
              </Link>
            ) : (
              <span>
                Próxima
                <ChevronRightIcon />
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
