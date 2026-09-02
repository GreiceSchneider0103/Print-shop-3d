import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, normalizeHeader, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

type OperationConfigData = {
  potenciaImpressora: number;
  tarifaEnergia: number;
  custoEnergiaHora: number;
  maoObraHora: number;
  depreciacaoManutencao: number;
};

/**
 * Na planilha real, "Config Operação" não é uma tabela com uma coluna por
 * campo — é uma lista "Parâmetro | Valor | Observação", um parâmetro por
 * linha (ex.: linha "Potência da impressora (W)" | 250 | ...). Por isso
 * cada linha é identificada pelo texto do rótulo na coluna "Parâmetro",
 * não pelo nome de uma coluna.
 */
function matchLabel(label: string, ...keywords: string[]): boolean {
  const normalized = normalizeHeader(label);
  return keywords.every((keyword) => normalized.includes(normalizeHeader(keyword)));
}

/**
 * "Config Operação" tem um valor vigente por parâmetro, não uma lista — a
 * planilha traz um parâmetro por linha. Guardamos como histórico (cada
 * sync com mudança cria uma nova linha) e as telas sempre leem a mais
 * recente por `atualizadoEm`.
 */
export async function syncOperationConfig() {
  const { rows } = await readSheetTab(SHEET_TABS.operationConfig, "parametro");

  const data: OperationConfigData = {
    potenciaImpressora: 0,
    tarifaEnergia: 0,
    custoEnergiaHora: 0,
    maoObraHora: 0,
    depreciacaoManutencao: 0,
  };
  let matched = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);
    const label = r.get("parametro", "campo") ?? "";
    const valor = parseNumber(r.get("valor"));
    if (!label || valor === null) continue;

    if (matchLabel(label, "potencia")) {
      data.potenciaImpressora = valor;
    } else if (matchLabel(label, "tarifa", "energia")) {
      data.tarifaEnergia = valor;
    } else if (matchLabel(label, "custo", "energia")) {
      data.custoEnergiaHora = valor;
    } else if (matchLabel(label, "mao", "obra")) {
      data.maoObraHora = valor;
    } else if (matchLabel(label, "depreciacao")) {
      data.depreciacaoManutencao = valor;
    } else {
      continue;
    }
    matched += 1;
  }

  if (matched === 0) {
    return { processed: 0, skipped: rows.length, total: rows.length };
  }

  const latest = await db.operationConfig.findFirst({ orderBy: { atualizadoEm: "desc" } });

  const changed =
    !latest ||
    Object.entries(data).some(
      ([key, value]) => Number(latest[key as keyof OperationConfigData]) !== value,
    );

  if (changed) {
    await db.operationConfig.create({ data });
  }

  return { processed: matched, skipped: rows.length - matched, total: rows.length };
}
