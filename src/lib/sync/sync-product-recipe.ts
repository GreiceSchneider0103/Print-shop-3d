import { db } from "@/lib/db";

import { mapWithConcurrency } from "./concurrency";
import { SHEET_TABS } from "./config";
import { buildRowLookup, normalizeHeader, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

const UPSERT_CONCURRENCY = 15;

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
    // normalizeHeader já remove espaços/acentos: "Filamento 1" -> "filamento1",
    // "Filamento 2 (opcional)" -> "filamento2opcional" — por isso sem "$" no
    // fim do regex, para não perder a ordem por causa do texto explicativo
    // colado depois do número.
    const match = /^filamento(\d+)/.exec(normalizeHeader(header));
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
  const { headers, rows } = await readSheetTab(SHEET_TABS.productRecipe, "sku");
  const orders = extractFilamentPairs(headers);

  // Busca todos os SKUs existentes de uma vez em vez de checar um por um —
  // era isso, não a leitura da planilha, que fazia essa aba demorar tanto:
  // um `findUnique` pra CADA linha (inclusive as em branco) é uma viagem de
  // rede por linha só pra descobrir que a maioria vai ser ignorada.
  const existingSkus = new Set((await db.product.findMany({ select: { sku: true } })).map((p) => p.sku));

  let skipped = 0;
  // Chave -> linha: se o mesmo SKU aparecer mais de uma vez, a última linha
  // vence — e evita duas requisições concorrentes mexendo na ficha técnica
  // do mesmo SKU ao mesmo tempo.
  const bySku = new Map<string, ReturnType<typeof buildRowLookup>>();

  for (const row of rows) {
    const r = buildRowLookup(row);
    const sku = r.get("sku");
    if (!sku || !existingSkus.has(sku)) {
      skipped += 1;
      continue;
    }
    bySku.set(sku, r);
  }

  const validRows = Array.from(bySku.entries()).map(([sku, r]) => ({ sku, r }));

  const processedCounts = await mapWithConcurrency(validRows, UPSERT_CONCURRENCY, async ({ sku, r }) => {
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
    }

    // Remove entradas antigas de ordens que existiam antes mas não vieram
    // mais nesta sincronização (ex.: peça que usava 2 filamentos passou a
    // usar só 1) — sem isso a ficha técnica acumula lixo indefinidamente.
    await db.productRecipe.deleteMany({
      where: { sku, ordem: { notIn: ordensPreenchidas.length > 0 ? ordensPreenchidas : orders } },
    });

    return ordensPreenchidas.length;
  });

  const processed = processedCounts.reduce((sum, count) => sum + count, 0);

  return { processed, skipped, total: rows.length };
}
