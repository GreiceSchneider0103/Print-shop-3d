import { db } from "@/lib/db";
import { computeOrderMargin } from "@/lib/finance";

export type MonthlyPoint = {
  month: string; // YYYY-MM
  faturamento: number;
  margem: number;
  custosFixos: number;
  lucroLiquido: number;
};

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Começa no mês do primeiro pedido registrado (quando a operação
 * realmente começou), não numa janela fixa de N meses — evita mostrar
 * meses vazios antes da loja existir.
 */
export async function getMonthlySeries(): Promise<MonthlyPoint[]> {
  const now = new Date();
  const earliestOrder = await db.order.aggregate({ _min: { dataVenda: true } });
  const earliestDate = earliestOrder._min.dataVenda ?? now;
  const from = new Date(Date.UTC(earliestDate.getUTCFullYear(), earliestDate.getUTCMonth(), 1));
  const months =
    (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + (now.getUTCMonth() - from.getUTCMonth()) + 1;

  const [orders, fixedCosts] = await Promise.all([
    db.order.findMany({ where: { dataVenda: { gte: from } } }),
    db.fixedCost.findMany({ where: { mes: { gte: from } } }),
  ]);

  const skus = Array.from(new Set(orders.map((o) => o.sku)));
  const products = skus.length ? await db.product.findMany({ where: { sku: { in: skus } } }) : [];
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const points = new Map<string, MonthlyPoint>();
  for (let i = 0; i < months; i += 1) {
    const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    const key = monthKey(date);
    points.set(key, { month: key, faturamento: 0, margem: 0, custosFixos: 0, lucroLiquido: 0 });
  }

  for (const order of orders) {
    const key = monthKey(order.dataVenda);
    const point = points.get(key);
    if (!point) continue;

    const { margem } = computeOrderMargin(order, productBySku.get(order.sku));
    point.faturamento += Number(order.valorTotal);
    point.margem += margem;
  }

  for (const fixedCost of fixedCosts) {
    const key = monthKey(fixedCost.mes);
    const point = points.get(key);
    if (point) point.custosFixos += Number(fixedCost.total);
  }

  for (const point of points.values()) {
    point.lucroLiquido = point.margem - point.custosFixos;
  }

  return Array.from(points.values());
}
