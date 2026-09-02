import { google } from "googleapis";

import { getServiceAccountCredentials, getSpreadsheetId } from "./config";
import { normalizeHeader } from "./parsers";

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

const HEADER_SCAN_WINDOW = 15;

/**
 * Várias abas da planilha real têm linha(s) de título/instrução antes do
 * cabeçalho de verdade (ex.: "Vendas" tem 1 linha de título acima do
 * cabeçalho, "CMV" tem 2 — título + texto de ajuda —, "Ficha Técnica" tem 3
 * incluindo uma linha em branco). "Mais células preenchidas" não é
 * suficiente pra achar o cabeçalho sozinho: na aba "CMV" algumas linhas de
 * produto (com preço em Mercado Livre/Shopee/TikTok preenchido) têm mais
 * células não-vazias que o próprio cabeçalho.
 *
 * Por isso, quando um `headerHint` é passado (uma palavra que só aparece
 * como texto de uma coluna do cabeçalho, nunca como valor de dado — ex.:
 * "sku", "situacao"), a primeira linha cujo texto de alguma célula CURTA
 * contém esse hint (normalizado) é o cabeçalho. O limite de tamanho da
 * célula é essencial: a aba "CMV" tem uma frase de instrução ("Preencha o
 * custo (CMV) de cada SKU que você vende...") que contém a palavra "SKU"
 * no meio de uma frase longa — sem o limite, essa frase seria confundida
 * com o cabeçalho. Sem hint (ou sem nenhuma célula curta batendo), cai
 * para a heurística de "linha com mais células preenchidas".
 */
const HEADER_CELL_MAX_LENGTH = 40;

function findHeaderRowIndex(values: string[][], headerHint?: string): number {
  const window = values.slice(0, HEADER_SCAN_WINDOW);

  if (headerHint) {
    const normalizedHint = normalizeHeader(headerHint);
    const hintIndex = window.findIndex((row) =>
      row.some((cell) => {
        const text = String(cell ?? "");
        return text.length <= HEADER_CELL_MAX_LENGTH && normalizeHeader(text).includes(normalizedHint);
      }),
    );
    if (hintIndex >= 0) return hintIndex;
  }

  const nonEmptyCounts = window.map(
    (row) => row.filter((cell) => String(cell ?? "").trim() !== "").length,
  );
  const maxCount = Math.max(...nonEmptyCounts);
  return nonEmptyCounts.indexOf(maxCount);
}

/**
 * Transforma a matriz bruta retornada pela Sheets API em objetos por linha,
 * localizando primeiro a linha de cabeçalho real (ver `findHeaderRowIndex`).
 * Extraída à parte para poder ser testada sem depender da API do Google.
 */
export function parseSheetValues(
  values: string[][],
  headerHint?: string,
): {
  headers: string[];
  rows: Record<string, string>[];
} {
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headerIndex = findHeaderRowIndex(values, headerHint);
  const headerRow = values[headerIndex];
  const dataRows = values.slice(headerIndex + 1);
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
 * Lê uma aba inteira e devolve como lista de objetos, localizando a linha
 * de cabeçalho de verdade (ver `findHeaderRowIndex` — nem sempre é a
 * primeira linha). As chaves são normalizadas (ver `normalizeHeader`) para
 * tolerar pequenas variações de acentuação/espaçamento entre o que o
 * escopo documenta e o cabeçalho real da planilha.
 *
 * `headerHint`: palavra que só aparece no texto do cabeçalho, nunca como
 * valor de dado (ex.: "sku", "situacao") — usada para achar a linha do
 * cabeçalho com segurança em abas que têm título/instrução antes dela.
 */
export async function readSheetTab(
  tabName: string,
  headerHint?: string,
): Promise<{
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

  return parseSheetValues((data.values ?? []) as string[][], headerHint);
}
