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
 * Em notação A1 do Sheets, um nome de aba com espaço ou caractere especial
 * precisa ficar entre aspas simples (ex.: `'Ficha Técnica'`) — sem isso a
 * API responde 400 "Unable to parse range". Duas das abas padrão têm
 * espaço no nome ("Ficha Técnica", "Config Operação"), então isso não é
 * opcional.
 */
export function quoteSheetName(tabName: string): string {
  return `'${tabName.replace(/'/g, "''")}'`;
}

/**
 * Transforma a matriz bruta retornada pela Sheets API (primeira linha =
 * cabeçalho) em objetos por linha. Extraída à parte para poder ser testada
 * sem depender da API do Google.
 */
export function parseSheetValues(values: string[][]): {
  headers: string[];
  rows: Record<string, string>[];
} {
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
    range: quoteSheetName(tabName),
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });

  return parseSheetValues((data.values ?? []) as string[][]);
}
