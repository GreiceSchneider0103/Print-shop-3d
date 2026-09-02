import type { Order, Product } from "@prisma/client";

export type OrderMargin = {
  cmv: number;
  margem: number;
  margemPct: number;
};

/**
 * Réplica o cálculo de margem por pedido que hoje vive nas fórmulas da
 * planilha: faturamento − comissão − frete − CMV (custo unitário do SKU ×
 * quantidade). Quando o SKU do pedido não está cadastrado em `products`
 * (SKU descontinuado/erro de digitação), o CMV é tratado como 0 e a
 * margem fica superestimada — mesma limitação que a planilha atual tem.
 */
export function computeOrderMargin(
  order: Pick<Order, "valorTotal" | "comissao" | "freteCliente" | "freteEmpresa" | "quantidade">,
  product: Pick<Product, "custoUnitario"> | undefined,
): OrderMargin {
  const valorTotal = Number(order.valorTotal);
  const cmv = product ? Number(product.custoUnitario) * order.quantidade : 0;
  const margem =
    valorTotal - Number(order.comissao) - Number(order.freteCliente) - Number(order.freteEmpresa) - cmv;
  const margemPct = valorTotal > 0 ? margem / valorTotal : 0;

  return { cmv, margem, margemPct };
}
