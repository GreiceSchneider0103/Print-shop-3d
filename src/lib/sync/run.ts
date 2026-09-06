import { db } from "@/lib/db";
import { SyncStatus } from "@prisma/client";

import { SHEET_TABS } from "./config";
import { prefetchTabs } from "./sheets-client";
import { syncOrders } from "./sync-orders";
import { syncProduction } from "./sync-production";

type SyncResult = { processed: number; skipped: number; total: number };

type SyncStep = {
  tab: string;
  run: () => Promise<SyncResult>;
};

// Só Vendas e Produção ainda sincronizam automaticamente. Ficha Técnica
// (product_recipe), CMV (produto/custo/tempo/preços), Custos Fixos, Taxas
// por canal, Config Operação e Prazos saíram do pipeline: todos já têm
// CRUD manual completo no app (/ficha-tecnica e as abas de
// /configuracoes) e sincronizar de novo sobrescreveria o que for editado
// manualmente. Os dados já importados continuam no banco — só a
// sincronização automática desses seis parou.
const STEPS: SyncStep[] = [
  { tab: SHEET_TABS.orders, run: syncOrders },
  { tab: SHEET_TABS.production, run: syncProduction },
];

export type SyncSummary = {
  tab: string;
  status: SyncStatus;
  processed: number;
  skipped: number;
  total: number;
  error?: string;
};

export async function runFullSync(): Promise<SyncSummary[]> {
  const summaries: SyncSummary[] = [];

  // Busca todas as abas de uma vez (1 requisição) em vez de uma por aba —
  // ver comentário em `prefetchTabs`. Best-effort: se falhar, cada etapa
  // cai pro fallback individual (mais lento, mas ainda funciona).
  try {
    await prefetchTabs(STEPS.map((step) => step.tab));
  } catch {
    // ignorado de propósito — ver comentário acima
  }

  for (const step of STEPS) {
    const startedAt = new Date();

    try {
      const result = await step.run();
      const status = result.skipped > 0 ? SyncStatus.PARTIAL : SyncStatus.SUCCESS;

      await db.syncLog.create({
        data: {
          sheetTab: step.tab,
          status,
          recordsProcessed: result.processed,
          recordsSkipped: result.skipped,
          startedAt,
          finishedAt: new Date(),
        },
      });

      summaries.push({ tab: step.tab, status, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await db.syncLog.create({
        data: {
          sheetTab: step.tab,
          status: SyncStatus.ERROR,
          recordsProcessed: 0,
          errorMessage: message,
          startedAt,
          finishedAt: new Date(),
        },
      });

      summaries.push({
        tab: step.tab,
        status: SyncStatus.ERROR,
        processed: 0,
        skipped: 0,
        total: 0,
        error: message,
      });
    }
  }

  return summaries;
}
