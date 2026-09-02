"use server";

import { revalidatePath } from "next/cache";

import { runFullSync, type SyncSummary } from "@/lib/sync/run";

export async function triggerManualSync(): Promise<SyncSummary[]> {
  const summaries = await runFullSync();
  revalidatePath("/configuracoes");
  return summaries;
}
