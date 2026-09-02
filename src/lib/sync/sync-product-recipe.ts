import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, normalizeHeader, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

/**
 * A ficha técnica permite N filamentos por SKU. Na planilha isso é
 * representado como pares de colunas repetidos: "Filamento 1"/"Gramas 1",
 * "Filamento 2"/"Gramas 2", etc. Esta função descobre dinamicamente quantos
 * pares existem a partir do cabeçalho, sem limitar a 2 como a planilha
 * atual — atendendo ao pedido do escopo de "permitir N filamentos".
 */
export function extractFilamentPairs(headers: string[]): number[] {
  const orders = new Set<number>();

  for (const header of headers) {
    // normalizeHeader já remove espaços/acentos: "Filamento 1" -> "filamento1"
    const match = /^filamento(\d+)$/.exec(normalizeHeader(header));
    if (match) orders.add(Number(match[1]));
  }

  // Planilha atual só tem "Filamento"/"Gramas" sem número (peça de 1
  // filamento só). Nesse caso tratamos como ordem 1.
  if (orders.size === 0 && headers.some((h) => normalizeHeader(h) === "filamento")) {
    orders.add(1);
  }

  return Array.from(orders).sort((a, b) => a - b);
}

export async function syncProductRecipe() {
  const { headers, rows } = await readSheetTab(SHEET_TABS.productRecipe);
  const orders = extractFilamentPairs(headers);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);
    const sku = r.get("sku");
    if (!sku) {
      skipped += 1;
      continue;
    }

    const productExists = await db.product.findUnique({ where: { sku }, select: { sku: true } });
    if (!productExists) {
      skipped += 1;
      continue;
    }

    const ordensPreenchidas: number[] = [];

    for (const ordem of orders) {
      const filamentoAliases = [`filamento_${ordem}`, `filamento${ordem}`, ...(ordem === 1 ? ["filamento"] : [])];
      const gramasAliases = [`gramas_${ordem}`, `gramas${ordem}`, ...(ordem === 1 ? ["gramas"] : [])];
      const filamento = r.get(...filamentoAliases);
      const gramas = parseNumber(r.get(...gramasAliases));

      if (!filamento || gramas === null) continue;

      await db.productRecipe.upsert({
        where: { sku_ordem: { sku, ordem } },
        create: { sku, ordem, filamento, gramas },
        update: { filamento, gramas },
      });

      ordensPreenchidas.push(ordem);
      processed += 1;
    }

    // Remove entradas antigas de ordens que existiam antes mas não vieram
    // mais nesta sincronização (ex.: peça que usava 2 filamentos passou a
    // usar só 1) — sem isso a ficha técnica acumula lixo indefinidamente.
    await db.productRecipe.deleteMany({
      where: { sku, ordem: { notIn: ordensPreenchidas.length > 0 ? ordensPreenchidas : orders } },
    });
  }

  return { processed, skipped, total: rows.length };
}
