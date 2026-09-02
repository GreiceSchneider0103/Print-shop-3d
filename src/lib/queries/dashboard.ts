import { db } from "@/lib/db";
import { computeOrderMargin } from "@/lib/finance";
import type { DateRange } from "@/lib/period";

export type ChannelBreakdown = {
  canal: string;
  faturamento: number;
  margem: number;
  pedidos: number;
};

export type ProductRanking = {
  sku: string;
  produto: string;
  faturamento: number;
  margem: number;
  quantidade: number;
};

export type DashboardData = {
  faturamentoTotal: number;
  margemTotal: number;
  margemPct: number;
  numPedidos: number;
  itensVendidos: number;
  ticketMedio: number;
  porCanal: ChannelBreakdown[];
  topPorMargem: ProductRanking[];
  topPorFaturamento: ProductRanking[];
};

async function loadOrdersWithMargin(range: DateRange) {
  const orders = await db.order.findMany({
    where: { dataVenda: { gte: range.from, lte: range.to } },
  });

  const skus = Array.from(new Set(orders.map((o) => o.sku)));
  const products = skus.length
    ? await db.product.findMany({ where: { sku: { in: skus } } })
    : [];
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  return orders.map((order) => ({
    order,
    ...computeOrderMargin(order, productBySku.get(order.sku)),
  }));
}

export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  const enriched = await loadOrdersWithMargin(range);

  const faturamentoTotal = enriched.reduce((sum, e) => sum + Number(e.order.valorTotal), 0);
  const margemTotal = enriched.reduce((sum, e) => sum + e.margem, 0);
  const numPedidos = new Set(enriched.map((e) => e.order.numeroPedido)).size;
  const itensVendidos = enriched.reduce((sum, e) => sum + e.order.quantidade, 0);

  const canalMap = new Map<string, ChannelBreakdown>();
  const produtoMap = new Map<string, ProductRanking>();

  for (const e of enriched) {
    const canal = canalMap.get(e.order.canal) ?? {
      canal: e.order.canal,
      faturamento: 0,
      margem: 0,
      pedidos: 0,
    };
    canal.faturamento += Number(e.order.valorTotal);
    canal.margem += e.margem;
    canal.pedidos += 1;
    canalMap.set(e.order.canal, canal);

    const produto = produtoMap.get(e.order.sku) ?? {
      sku: e.order.sku,
      produto: e.order.produto,
      faturamento: 0,
      margem: 0,
      quantidade: 0,
    };
    produto.faturamento += Number(e.order.valorTotal);
    produto.margem += e.margem;
    produto.quantidade += e.order.quantidade;
    produtoMap.set(e.order.sku, produto);
  }

  const produtos = Array.from(produtoMap.values());

  return {
    faturamentoTotal,
    margemTotal,
    margemPct: faturamentoTotal > 0 ? margemTotal / faturamentoTotal : 0,
    numPedidos,
    itensVendidos,
    ticketMedio: numPedidos > 0 ? faturamentoTotal / numPedidos : 0,
    porCanal: Array.from(canalMap.values()).sort((a, b) => b.faturamento - a.faturamento),
    topPorMargem: [...produtos].sort((a, b) => b.margem - a.margem).slice(0, 5),
    topPorFaturamento: [...produtos].sort((a, b) => b.faturamento - a.faturamento).slice(0, 5),
  };
}
