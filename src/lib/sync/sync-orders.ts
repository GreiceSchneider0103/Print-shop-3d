import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseDate, parseIntOrNull, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

export async function syncOrders() {
  const { rows } = await readSheetTab(SHEET_TABS.orders);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);

    const numeroPedido = r.get("numero_pedido", "numero pedido", "pedido");
    const sku = r.get("sku");
    const canal = r.get("canal");
    const dataVenda = parseDate(r.get("data_venda", "data venda", "data"));

    if (!numeroPedido || !sku || !canal || !dataVenda) {
      skipped += 1;
      continue;
    }

    await db.order.upsert({
      where: {
        numeroPedido_canal_sku: { numeroPedido, canal, sku },
      },
      create: {
        numeroPedido,
        numeroEcommerce: r.get("numero_ecommerce", "numero ecommerce") || null,
        dataVenda,
        sku,
        produto: r.get("produto") || "",
        quantidade: parseIntOrNull(r.get("quantidade")) ?? 1,
        valorTotal: parseNumber(r.get("valor_total", "valor total")) ?? 0,
        comissao: parseNumber(r.get("comissao", "comissão")) ?? 0,
        freteCliente: parseNumber(r.get("frete_cliente", "frete cliente")) ?? 0,
        freteEmpresa: parseNumber(r.get("frete_empresa", "frete empresa")) ?? 0,
        canal,
        uf: r.get("uf") || null,
        situacao: r.get("situacao") || "",
        clienteNome: r.get("cliente_nome", "cliente", "nome do cliente") || null,
      },
      update: {
        numeroEcommerce: r.get("numero_ecommerce", "numero ecommerce") || null,
        dataVenda,
        produto: r.get("produto") || "",
        quantidade: parseIntOrNull(r.get("quantidade")) ?? 1,
        valorTotal: parseNumber(r.get("valor_total", "valor total")) ?? 0,
        comissao: parseNumber(r.get("comissao", "comissão")) ?? 0,
        freteCliente: parseNumber(r.get("frete_cliente", "frete cliente")) ?? 0,
        freteEmpresa: parseNumber(r.get("frete_empresa", "frete empresa")) ?? 0,
        uf: r.get("uf") || null,
        situacao: r.get("situacao") || "",
        clienteNome: r.get("cliente_nome", "cliente", "nome do cliente") || null,
      },
    });

    processed += 1;
  }

  return { processed, skipped, total: rows.length };
}
