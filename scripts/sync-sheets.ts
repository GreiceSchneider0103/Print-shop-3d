/**
 * Executa a sincronização com o Google Sheets manualmente (dev/local).
 * Uso: npm run sync:sheets
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { runFullSync } = await import("../src/lib/sync/run");

  console.log("Iniciando sincronização com o Google Sheets...\n");

  const summaries = await runFullSync();

  for (const summary of summaries) {
    const line = `[${summary.status}] ${summary.tab} — processados: ${summary.processed}, ignorados: ${summary.skipped}, total na aba: ${summary.total}`;
    console.log(summary.status === "ERROR" ? `${line}\n  erro: ${summary.error}` : line);
  }

  const hasError = summaries.some((s) => s.status === "ERROR");
  process.exit(hasError ? 1 : 0);
}

main().catch((error) => {
  console.error("Falha ao rodar sincronização:", error);
  process.exit(1);
});
