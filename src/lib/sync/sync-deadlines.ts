import { db } from "@/lib/db";

import { SHEET_TABS } from "./config";
import { buildRowLookup, parseIntOrNull } from "./parsers";
import { readSheetTab } from "./sheets-client";

export async function syncDeadlines() {
  const { rows } = await readSheetTab(SHEET_TABS.deadlines);

  let processed = 0;
  let skipped = 0;

  for (const row of rows) {
    const r = buildRowLookup(row);
    const canal = r.get("canal");
    const diasUteisPrazo = parseIntOrNull(
      r.get("dias_uteis_prazo", "dias uteis", "prazo (dias uteis)"),
    );

    if (!canal || diasUteisPrazo === null) {
      skipped += 1;
      continue;
    }

    await db.deadline.upsert({
      where: { canal },
      create: { canal, diasUteisPrazo, observacao: r.get("observacao") || null },
      update: { diasUteisPrazo, observacao: r.get("observacao") || null },
    });

    processed += 1;
  }

  return { processed, skipped, total: rows.length };
}
