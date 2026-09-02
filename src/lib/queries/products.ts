import { db } from "@/lib/db";
import { computeOrderMargin } from "@/lib/finance";

export type ProductAnalysis = {
  sku: string;
  produto: string;
  quantidade: number;
  faturamento: number;
  margem: number;
  margemPct: number;
  cumulativoPct: number;
  classe: "A" | "B" | "C";
};

/** Curva ABC: os SKUs que juntos respondem por 80% da margem são classe A. */
export async function getProductAnalysis(): Promise<ProductAnalysis[]> {
  const orders = await db.order.findMany();
  const products = await db.product.findMany();
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const bySku = new Map<string, { produto: string; quantidade: number; faturamento: number; margem: number }>();

  for (const order of orders) {
    const { margem } = computeOrderMargin(order, productBySku.get(order.sku));
    const entry = bySku.get(order.sku) ?? {
      produto: order.produto,
      quantidade: 0,
      faturamento: 0,
      margem: 0,
    };
    entry.quantidade += order.quantidade;
    entry.faturamento += Number(order.valorTotal);
    entry.margem += margem;
    bySku.set(order.sku, entry);
  }

  const totalMargem = Array.from(bySku.values()).reduce((sum, e) => sum + Math.max(e.margem, 0), 0);

  const sorted = Array.from(bySku.entries())
    .map(([sku, e]) => ({
      sku,
      produto: e.produto,
      quantidade: e.quantidade,
      faturamento: e.faturamento,
      margem: e.margem,
      margemPct: e.faturamento > 0 ? e.margem / e.faturamento : 0,
    }))
    .sort((a, b) => b.margem - a.margem);

  let acumulado = 0;
  return sorted.map((item) => {
    acumulado += Math.max(item.margem, 0);
    const cumulativoPct = totalMargem > 0 ? acumulado / totalMargem : 0;
    const classe: ProductAnalysis["classe"] =
      cumulativoPct <= 0.8 ? "A" : cumulativoPct <= 0.95 ? "B" : "C";

    return { ...item, cumulativoPct, classe };
  });
}
