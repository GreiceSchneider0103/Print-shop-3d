import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseMonth, parseNumber } from "./parsers";
import { readSheetTab } from "./sheets-client";

export async function syncFixedCosts() {
  const { rows } = await readSheetTab(SHEET_TABS.fixedCosts);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);
    const mes = parseMonth(r.get("mes"));
    if (!mes) {
      skipped += 1;
      continue;
    }

    const data = {
      ads: parseNumber(r.get("ads")) ?? 0,
      tiny: parseNumber(r.get("tiny")) ?? 0,
      mei: parseNumber(r.get("mei")) ?? 0,
      outros: parseNumber(r.get("outros")) ?? 0,
      parcela: parseNumber(r.get("parcela")) ?? 0,
      total: parseNumber(r.get("total")) ?? 0,
      reembolso: parseNumber(r.get("reembolso")) ?? 0,
    };

    await db.fixedCost.upsert({
      where: { mes },
      create: { mes, ...data },
      update: data,
    });

    processed += 1;
  }

  return { processed, skipped, total: rows.length };
}
