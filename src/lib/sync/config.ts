/**
 * Nomes das abas da planilha "Controle Financeiro 3D" e variáveis de
 * ambiente do job de sincronização.
 *
 * Os nomes reais das abas podem variar levemente em relação ao que está
 * documentado no escopo — ajuste os defaults abaixo (ou defina as variáveis
 * de ambiente equivalentes) assim que a planilha real for compartilhada.
 */
export const SHEET_TABS = {
  orders: process.env.SHEET_TAB_ORDERS || "Vendas",
  products: process.env.SHEET_TAB_PRODUCTS || "CMV",
  productRecipe: process.env.SHEET_TAB_RECIPE || "Ficha Técnica",
  channelFees: process.env.SHEET_TAB_FEES || "Taxas",
  fixedCosts: process.env.SHEET_TAB_FIXED_COSTS || "Fixos",
  operationConfig: process.env.SHEET_TAB_OPERATION_CONFIG || "Config Operação",
  deadlines: process.env.SHEET_TAB_DEADLINES || "Prazos",
} as const;

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!id) {
    throw new Error(
      "GOOGLE_SHEETS_SPREADSHEET_ID não configurado. Defina no .env o ID da planilha 'Controle Financeiro 3D'.",
    );
  }
  return id;
}

export function getServiceAccountCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não configurados.",
    );
  }

  // Suporta a chave colada com `\n` literais (comum em variáveis de
  // ambiente de plataformas como Vercel) ou já com quebras de linha reais.
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;

  return { clientEmail, privateKey };
}
