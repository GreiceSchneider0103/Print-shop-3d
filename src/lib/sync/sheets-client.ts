import { google } from "googleapis";

import { getServiceAccountCredentials, getSpreadsheetId } from "./config";

function getAuth() {
  const { clientEmail, privateKey } = getServiceAccountCredentials();

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Lê uma aba inteira e devolve como lista de objetos, usando a primeira
 * linha como cabeçalho. As chaves são normalizadas (ver `normalizeHeader`)
 * para tolerar pequenas variações de acentuação/espaçamento entre o que o
 * escopo documenta e o cabeçalho real da planilha.
 */
export async function readSheetTab(tabName: string): Promise<{
  headers: string[];
  rows: Record<string, string>[];
}> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: tabName,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  const values = data.values ?? [];
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((h) => String(h ?? "").trim());

  const rows = dataRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] ?? "").trim();
      });
      return record;
    });

  return { headers, rows };
}
