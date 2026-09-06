import { db } from "@/lib/db";
import { SyncStatus } from "@prisma/client";

import { SHEET_TABS } from "./config";
import { prefetchTabs } from "./sheets-client";
import { syncChannelFees } from "./sync-channel-fees";
import { syncDeadlines } from "./sync-deadlines";
import { syncOperationConfig } from "./sync-operation-config";
import { syncOrders } from "./sync-orders";
import { syncProduction } from "./sync-production";
import { syncProducts } from "./sync-products";

type SyncResult = { processed: number; skipped: number; total: number };

type SyncStep = {
  tab: string;
  run: () => Promise<SyncResult>;
};

// Ordem importa: orders pode ser independente. As demais são tabelas de
// configuração simples.
//
// Ficha Técnica (product_recipe) e Custos Fixos saíram do pipeline: os
// dois já têm CRUD manual completo no app (/ficha-tecnica e
// /configuracoes → Custos Fixos) e sincronizar de novo sobrescreveria o
// que for editado manualmente.
const STEPS: SyncStep[] = [
  { tab: SHEET_TABS.products, run: syncProducts },
  { tab: SHEET_TABS.orders, run: syncOrders },
  { tab: SHEET_TABS.production, run: syncProduction },
  { tab: SHEET_TABS.channelFees, run: syncChannelFees },
  { tab: SHEET_TABS.operationConfig, run: syncOperationConfig },
  { tab: SHEET_TABS.deadlines, run: syncDeadlines },
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
