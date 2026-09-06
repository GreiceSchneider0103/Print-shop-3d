import { getSpreadsheetId, SHEET_TABS } from "./config";
import { normalizeHeader } from "./parsers";
import { getSheetsClient, quoteSheetName } from "./sheets-client";
import { findProduzidoColumnIndex } from "./sync-production";

/** Índice de coluna 0-based -> letra de coluna A1 (0 -> A, 25 -> Z, 26 -> AA...). */
function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

/**
 * Marca a caixinha "produzido" como TRUE na planilha pra um pedido+SKU
 * específico — chamado quando o item é movido pra "Postado" no Kanban do
 * app, pra manter a esteira de produção da planilha em dia sem precisar
 * marcar na mão duas vezes (uma no app, outra na planilha).
 *
 * Lê a aba fresca (sem usar o cache do sync em lote) porque isso roda fora
 * do fluxo de sincronização, disparado por uma ação pontual do usuário no
 * Kanban. Retorna `false` (em vez de lançar) quando o pedido não é
 * encontrado na planilha — pode ter sido digitado direto no app, ou a
 * linha já não existe mais lá.
 *
 * Requer que a service account tenha permissão de EDITOR na planilha (o
 * README documenta só Leitor, suficiente pra sincronização de leitura) —
 * sem isso, a chamada à API lança e quem chamou decide como avisar.
 */
export async function markProducedInSheet(pedido: string, sku: string): Promise<boolean> {
  const sheets = getSheetsClient();
  const tab = SHEET_TABS.production;
  const spreadsheetId = getSpreadsheetId();

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: quoteSheetName(tab),
    valueRenderOption: "FORMATTED_VALUE",
  });
  const values = (data.values ?? []) as string[][];
  if (values.length === 0) return false;

  const headerIndex = values.findIndex((row) =>
    row.some((cell) => normalizeHeader(String(cell ?? "")).includes("pedido")),
  );
  if (headerIndex < 0) return false;

  const headers = values[headerIndex].map((h) => String(h ?? "").trim());
  const pedidoIdx = headers.findIndex((h) => normalizeHeader(h).includes("pedido"));
  const skuIdx = headers.findIndex((h) => normalizeHeader(h).includes("sku"));
  const checkboxIdx = findProduzidoColumnIndex(headers);
  if (pedidoIdx < 0 || skuIdx < 0 || checkboxIdx < 0) return false;

  const rowIndex = values.findIndex(
    (row, i) =>
      i > headerIndex &&
      String(row[pedidoIdx] ?? "").trim() === pedido &&
      String(row[skuIdx] ?? "").trim() === sku,
  );
  if (rowIndex < 0) return false;

  const sheetRowNumber = rowIndex + 1; // `values` é 0-indexado; linhas do Sheets são 1-indexadas
  const range = `${quoteSheetName(tab)}!${columnLetter(checkboxIdx)}${sheetRowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[true]] },
  });

  return true;
}
