import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { computeOrderMargin } from "@/lib/finance";

export type OrderFilters = {
  canal?: string;
  situacao?: string;
  sku?: string;
  uf?: string;
  from?: string;
  to?: string;
};

const PAGE_SIZE = 50;

export async function listOrders(filters: OrderFilters, page = 1) {
  const where: Prisma.OrderWhereInput = {
    ...(filters.canal ? { canal: filters.canal } : {}),
    ...(filters.situacao ? { situacao: filters.situacao } : {}),
    ...(filters.sku ? { sku: { contains: filters.sku, mode: "insensitive" } } : {}),
    ...(filters.uf ? { uf: filters.uf } : {}),
    ...(filters.from || filters.to
      ? {
          dataVenda: {
            ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00Z`) } : {}),
            ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59Z`) } : {}),
          },
        }
      : {}),
  };

  const [orders, total, canais, situacoes] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { dataVenda: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
    db.order.findMany({ distinct: ["canal"], select: { canal: true } }),
    db.order.findMany({ distinct: ["situacao"], select: { situacao: true } }),
  ]);

  const skus = Array.from(new Set(orders.map((o) => o.sku)));
  const products = skus.length ? await db.product.findMany({ where: { sku: { in: skus } } }) : [];
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const enriched = orders.map((order) => ({
    order,
    ...computeOrderMargin(order, productBySku.get(order.sku)),
  }));

  return {
    orders: enriched,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    canais: canais.map((c) => c.canal).sort(),
    situacoes: situacoes.map((s) => s.situacao).filter(Boolean).sort(),
  };
}

export async function getOrderById(id: number) {
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return null;

  const product = await db.product.findUnique({ where: { sku: order.sku } });
  const margin = computeOrderMargin(order, product ?? undefined);

  return { order, product, ...margin };
}
