import { db } from "@/lib/db";

import { mapWithConcurrency } from "./concurrency";
import { SHEET_TABS } from "./config";
import { buildRowLookup, normalizeHeader, parseDate, parseIntOrNull } from "./parsers";
import { readSheetTab } from "./sheets-client";

const UPSERT_CONCURRENCY = 15;

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "true" || v === "verdadeiro" || v === "sim" || v === "1" || v === "x";
}

/**
 * A aba "Produção" tem uma coluna checkbox sem um nome de cabeçalho
 * confiável (o texto acaba sendo o próprio estado TRUE/FALSE da caixinha
 * na linha de cabeçalho). Em vez de tentar casar por nome, localiza a
 * coluna pela posição (logo depois de "Canal", confirmado na planilha
 * real) — resistente a qualquer texto que apareça no cabeçalho dela.
 */
function findProduzidoColumnIndex(headers: string[]): number {
  const canalIndex = headers.findIndex((h) => normalizeHeader(h).includes("canal"));
  return canalIndex >= 0 ? canalIndex + 1 : -1;
}

/**
 * Só importa pedidos AINDA NÃO marcados como produzidos na planilha
 * (checkbox desmarcado) — pedidos já concluídos lá são histórico e não
 * precisam entrar no Kanban. Usa (pedido, sku) como chave natural pra
 * fazer upsert sem nunca sobrescrever `status`/`estoqueBaixado`, que a
 * partir da primeira importação passam a ser controlados só pelo Kanban.
 */
export async function syncProduction() {
  const { headers, rows } = await readSheetTab(SHEET_TABS.production, "pedido");
  const produzidoIndex = findProduzidoColumnIndex(headers);

  let skipped = 0;
  // Chave -> dado: se a mesma combinação pedido/SKU aparecer mais de uma
  // vez, a última linha vence — e evita duas requisições concorrentes
  // tentando upsert na mesma chave.
  const byKey = new Map<
    string,
    {
      pedido: string;
      sku: string;
      data: { cliente: string | null; produto: string; quantidade: number; prazoPostagem: Date | null; canal: string };
    }
  >();

  for (const row of rows) {
    const r = buildRowLookup(row);

    const pedido = r.get("pedido");
    const sku = r.get("sku");
    const canal = r.get("canal");

    if (!pedido || !sku || !canal) {
      skipped += 1;
      continue;
    }

    const produzidoRaw = produzidoIndex >= 0 ? Object.values(row)[produzidoIndex] : undefined;
    if (parseBoolean(produzidoRaw)) {
      // Já produzido na planilha — histórico, não entra na fila.
      continue;
    }

    byKey.set(`${pedido} ${sku}`, {
      pedido,
      sku,
      data: {
        cliente: r.get("cliente") || null,
        produto: r.get("produto") || "",
        quantidade: parseIntOrNull(r.get("quantidade")) ?? 1,
        prazoPostagem: parseDate(r.get("prazo de postagem", "prazo_postagem", "prazo")),
        canal,
      },
    });
  }

  const validItems = Array.from(byKey.values());

  await mapWithConcurrency(validItems, UPSERT_CONCURRENCY, ({ pedido, sku, data }) =>
    db.productionQueueItem.upsert({
      where: { pedido_sku: { pedido, sku } },
      create: { pedido, sku, ...data },
      update: data,
    }),
  );

  return { processed: validItems.length, skipped, total: rows.length };
}
