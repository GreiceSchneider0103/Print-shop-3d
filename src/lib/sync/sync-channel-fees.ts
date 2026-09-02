import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseNumber, parsePercent } from "./parsers";
import { readSheetTab } from "./sheets-client";

/**
 * A tabela de taxas não tem uma chave natural única na planilha (o mesmo
 * canal aparece em várias faixas de valor). Fase 1 trata essa aba como
 * "somente leitura → substitui tudo a cada sync": apaga e recria, o que
 * evita duplicar faixas quando os valores de uma faixa existente mudam.
 */
export async function syncChannelFees() {
  const { rows } = await readSheetTab(SHEET_TABS.channelFees);

  const parsed = rows
    .map((row) => {
      const r = buildRowLookup(row);
      const canal = r.get("canal");
      if (!canal) return null;

      return {
        canal,
        valorMin: parseNumber(r.get("valor_min", "valor minimo", "de")) ?? 0,
        valorMax: parseNumber(r.get("valor_max", "valor maximo", "ate")) ?? 0,
        comissaoPct: parsePercent(r.get("comissao_pct", "comissao", "%comissao")) ?? 0,
        taxaFixa: parseNumber(r.get("taxa_fixa", "taxa fixa")) ?? 0,
        observacao: r.get("observacao") || null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  await db.$transaction([
    db.channelFee.deleteMany({}),
    ...(parsed.length > 0 ? [db.channelFee.createMany({ data: parsed })] : []),
  ]);

  return { processed: parsed.length, skipped: rows.length - parsed.length, total: rows.length };
}
