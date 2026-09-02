import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

/**
 * "Config Operação" é um parâmetro único da operação, não uma lista — a
 * planilha deve trazer uma única linha de dados. Guardamos como histórico
 * (cada sync cria uma nova linha) e as telas devem sempre ler a mais
 * recente por `atualizadoEm`.
 */
export async function syncOperationConfig() {
  const { rows } = await readSheetTab(SHEET_TABS.operationConfig);
  const lastRow = rows[rows.length - 1];

  if (!lastRow) {
    return { processed: 0, skipped: 0, total: 0 };
  }

  const r = buildRowLookup(lastRow);

  const data = {
    potenciaImpressora:
      parseNumber(r.get("potencia_impressora", "potencia da impressora")) ?? 0,
    tarifaEnergia: parseNumber(r.get("tarifa_energia", "tarifa de energia")) ?? 0,
    custoEnergiaHora: parseNumber(r.get("custo_energia_hora", "custo energia hora")) ?? 0,
    maoObraHora: parseNumber(r.get("mao_obra_hora", "mao de obra hora", "mao de obra/hora")) ?? 0,
    depreciacaoManutencao:
      parseNumber(r.get("depreciacao_manutencao", "depreciacao e manutencao")) ?? 0,
  };

  const latest = await db.operationConfig.findFirst({ orderBy: { atualizadoEm: "desc" } });

  const changed =
    !latest ||
    Object.entries(data).some(
      ([key, value]) => Number(latest[key as keyof typeof data]) !== value,
    );

  if (changed) {
    await db.operationConfig.create({ data });
  }

  return { processed: 1, skipped: 0, total: rows.length };
}
