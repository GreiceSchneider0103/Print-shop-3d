import type { Order, Product } from "@prisma/client";

export type OrderMargin = {
  cmv: number;
  margem: number;
  margemPct: number;
};

/**
 * Situações que não representam venda de fato faturada — pedido cancelado
 * ou ainda não pago — e por isso não devem entrar em faturamento/margem
 * nos relatórios (Dashboard Geral, Dashboard Mensal, Análise por Produto).
 * A lista de Vendas/Pedidos continua mostrando todos os pedidos (é uma
 * tela de gestão, não de relatório) — o filtro é só nas consultas que
 * somam dinheiro.
 */
const NON_REVENUE_SITUATIONS = new Set(
  ["Cancelado", "Em aberto", "Dados incompletos"].map((s) => s.toLowerCase()),
);

/** Comparação case-insensitive — os nomes exatos vêm da planilha e podem variar de capitalização entre sincronizações. */
export function isRevenueOrder(situacao: string): boolean {
  return !NON_REVENUE_SITUATIONS.has(situacao.trim().toLowerCase());
}

/**
 * Faturamento − comissão − frete empresa − CMV (custo unitário do SKU ×
 * quantidade). Quando o SKU do pedido não está cadastrado em `products`
 * (SKU descontinuado/erro de digitação), o CMV é tratado como 0 e a
 * margem fica superestimada — mesma limitação que a planilha atual tem.
 *
 * `freteCliente` (frete pago pelo cliente, ex.: pedidos Shopee) NÃO entra
 * na conta: é cobrado à parte do valor do pedido e repassado pela
 * plataforma direto pro parceiro logístico — nunca chega a fazer parte do
 * faturamento do vendedor, então subtraí-lo de novo aqui distorcia a
 * margem pra negativo mesmo em pedidos lucrativos. Só `freteEmpresa`
 * (frete que a loja paga do próprio bolso, ex.: venda direta) é custo real.
 */
export function computeOrderMargin(
  order: Pick<Order, "valorTotal" | "comissao" | "freteEmpresa" | "quantidade">,
  product: Pick<Product, "custoUnitario"> | undefined,
): OrderMargin {
  const valorTotal = Number(order.valorTotal);
  const cmv = product ? Number(product.custoUnitario) * order.quantidade : 0;
  const margem = valorTotal - Number(order.comissao) - Number(order.freteEmpresa) - cmv;
  const margemPct = valorTotal > 0 ? margem / valorTotal : 0;

  return { cmv, margem, margemPct };
}
