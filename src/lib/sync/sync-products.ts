import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseIntOrNull, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

export async function syncProducts() {
  const { rows } = await readSheetTab(SHEET_TABS.products);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);
    const sku = r.get("sku");

    if (!sku) {
      skipped += 1;
      continue;
    }

    // Aliases: cabeçalho real confirmado na planilha primeiro, variações
    // mais curtas como fallback.
    const data = {
      produto: r.get("produto") || "",
      custoUnitario: parseNumber(r.get("custo unitario (cmv)", "custo_unitario", "custo unitario")) ?? 0,
      tempoProducaoMin: parseIntOrNull(
        r.get("tempo de producao (min)", "tempo_producao_min", "tempo producao"),
      ),
      tipoAnuncioMl: r.get("tipo anuncio ml (classico/premium)", "tipo_anuncio_ml", "tipo anuncio ml") || null,
      diasPreparoMl: parseIntOrNull(
        r.get("dias de preparo so p sob encomenda", "dias_preparo_ml", "dias preparo ml"),
      ),
      precoMl: parseNumber(r.get("mercado livre", "preco_ml")),
      precoShopee: parseNumber(r.get("shopee", "preco_shopee")),
      precoTiktok: parseNumber(r.get("tiktok", "preco_tiktok")),
    };

    await db.product.upsert({
      where: { sku },
      create: { sku, ...data },
      update: data,
    });

    processed += 1;
  }

  return { processed, skipped, total: rows.length };
}
