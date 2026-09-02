import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseDate, parseIntOrNull, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

export async function syncOrders() {
  const { rows } = await readSheetTab(SHEET_TABS.orders, "situacao");

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);

    // Aliases na ordem: cabeçalho real confirmado na planilha, depois
    // variações mais curtas como fallback (útil se a planilha mudar).
    const numeroPedido = r.get("numero", "numero_pedido", "numero pedido", "pedido");
    const sku = r.get("codigo (sku)", "codigo", "sku");
    const canal = r.get("canal (e-commerce)", "canal");
    const dataVenda = parseDate(r.get("data da venda", "data_venda", "data venda", "data"));

    if (!numeroPedido || !sku || !canal || !dataVenda) {
      skipped += 1;
      continue;
    }

    const data = {
      numeroEcommerce:
        r.get("numero do pedido no e-commerce", "numero_ecommerce", "numero ecommerce") || null,
      dataVenda,
      produto: r.get("descricao do produto", "produto") || "",
      quantidade: parseIntOrNull(r.get("quantidade")) ?? 1,
      valorTotal: parseNumber(r.get("valor total da venda", "valor_total", "valor total")) ?? 0,
      comissao: parseNumber(r.get("comissao e-commerce", "comissao", "comissão")) ?? 0,
      freteCliente: parseNumber(r.get("frete pago pelo cliente", "frete_cliente", "frete cliente")) ?? 0,
      freteEmpresa: parseNumber(r.get("frete pago pela empresa", "frete_empresa", "frete empresa")) ?? 0,
      uf: r.get("uf") || null,
      situacao: r.get("situacao da venda", "situacao") || "",
      clienteNome: r.get("cliente_nome", "cliente", "nome do cliente") || null,
    };

    await db.order.upsert({
      where: { numeroPedido_canal_sku: { numeroPedido, canal, sku } },
      create: { numeroPedido, sku, canal, ...data },
      update: data,
    });

    processed += 1;
  }

  return { processed, skipped, total: rows.length };
}
