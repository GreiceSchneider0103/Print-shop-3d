import type { Order, Product } from "@prisma/client";

export type OrderMargin = {
  cmv: number;
  margem: number;
  margemPct: number;
};

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
