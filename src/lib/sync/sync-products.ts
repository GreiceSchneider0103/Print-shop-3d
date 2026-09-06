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

/**
 * `custoUnitario` e `tempoProducaoMin` agora também são editáveis direto na
 * Ficha Técnica (junto com os filamentos) — se o sync continuasse
 * sobrescrevendo os dois em toda sincronização, uma edição manual seria
 * desfeita na próxima vez que alguém clicasse em "Sincronizar agora" ou o
 * cron horário rodasse. Por isso só entram no `create` (SKU novo, vindo da
 * planilha pela primeira vez, começa com uma estimativa em vez de zero) —
 * o `update` de um SKU já existente nunca mexe nesses dois campos.
 */
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

  await mapWithConcurrency(validProducts, UPSERT_CONCURRENCY, ({ sku, data }) => {
    const updateData = {
      produto: data.produto,
      tipoAnuncioMl: data.tipoAnuncioMl,
      diasPreparoMl: data.diasPreparoMl,
      precoMl: data.precoMl,
      precoShopee: data.precoShopee,
      precoTiktok: data.precoTiktok,
    };
    return db.product.upsert({ where: { sku }, create: { sku, ...data }, update: updateData });
  });

  return { processed: validProducts.length, skipped, total: rows.length };
}
