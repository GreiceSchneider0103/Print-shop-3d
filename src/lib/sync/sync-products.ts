import { db } from "@/lib/db";

import { mapWithConcurrency } from "./concurrency";
import { SHEET_TABS } from "./config";
import { buildRowLookup, parseIntOrNull, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

const UPSERT_CONCURRENCY = 15;

function buildProductData(r: ReturnType<typeof buildRowLookup>) {
  return {
    produto: r.get("produto") || "",
    custoUnitario: parseNumber(r.get("custo unitario (cmv)", "custo_unitario", "custo unitario")) ?? 0,
    tempoProducaoMin: parseIntOrNull(r.get("tempo de producao (min)", "tempo_producao_min", "tempo producao")),
    tipoAnuncioMl: r.get("tipo anuncio ml (classico/premium)", "tipo_anuncio_ml", "tipo anuncio ml") || null,
    diasPreparoMl: parseIntOrNull(
      r.get("dias de preparo so p sob encomenda", "dias_preparo_ml", "dias preparo ml"),
    ),
    precoMl: parseNumber(r.get("mercado livre", "preco_ml")),
    precoShopee: parseNumber(r.get("shopee", "preco_shopee")),
    precoTiktok: parseNumber(r.get("tiktok", "preco_tiktok")),
  };
}

export async function syncProducts() {
  const { rows } = await readSheetTab(SHEET_TABS.products, "sku");

  let skipped = 0;
  // Chave -> dado: se o mesmo SKU aparecer mais de uma vez na planilha, a
  // última linha vence (mesmo comportamento do loop sequencial antigo) —
  // e evita duas requisições concorrentes tentando upsert na mesma chave.
  const bySku = new Map<string, ReturnType<typeof buildProductData>>();

  for (const row of rows) {
    const r = buildRowLookup(row);
    const sku = r.get("sku");

    if (!sku) {
      skipped += 1;
      continue;
    }

    bySku.set(sku, buildProductData(r));
  }

  const validProducts = Array.from(bySku.entries()).map(([sku, data]) => ({ sku, data }));

  await mapWithConcurrency(validProducts, UPSERT_CONCURRENCY, ({ sku, data }) =>
    db.product.upsert({ where: { sku }, create: { sku, ...data }, update: data }),
  );

  return { processed: validProducts.length, skipped, total: rows.length };
}
