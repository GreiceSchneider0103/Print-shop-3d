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

    const data = {
      produto: r.get("produto") || "",
      custoUnitario: parseNumber(r.get("custo_unitario", "custo unitario")) ?? 0,
      tempoProducaoMin: parseIntOrNull(
        r.get("tempo_producao_min", "tempo producao", "tempo de producao (min)"),
      ),
      tipoAnuncioMl: r.get("tipo_anuncio_ml", "tipo anuncio ml") || null,
      diasPreparoMl: parseIntOrNull(r.get("dias_preparo_ml", "dias preparo ml")),
      precoMl: parseNumber(r.get("preco_ml")),
      precoShopee: parseNumber(r.get("preco_shopee")),
      precoTiktok: parseNumber(r.get("preco_tiktok")),
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
