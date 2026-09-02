/**
 * Utilitários de parsing tolerantes ao formato "planilha brasileira":
 * números com vírgula decimal e ponto de milhar, moeda com "R$", datas
 * dd/mm/aaaa e cabeçalhos com variação de acentuação/espaçamento.
 */

export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ""); // remove espaços, underscores, símbolos
}

/**
 * Constrói um lookup normalizado -> valor a partir de uma linha da
 * planilha, para permitir buscar colunas por uma lista de aliases
 * tolerante a variação de nome.
 */
export function buildRowLookup(row: Record<string, string>) {
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    lookup.set(normalizeHeader(key), value);
  }

  return {
    get(...aliases: string[]): string | undefined {
      for (const alias of aliases) {
        const value = lookup.get(normalizeHeader(alias));
        if (value !== undefined && value !== "") return value;
      }
      return undefined;
    },
    raw: lookup,
  };
}

export function parseNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const cleaned = trimmed
    .replace(/r\$/gi, "")
    .replace(/%/g, "")
    .trim()
    .replace(/\.(?=\d{3}(?:\D|$))/g, "") // ponto de milhar
    .replace(",", "."); // vírgula decimal -> ponto

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Converte "12%" ou "12" ou "0,12" para fração decimal (0.12). */
export function parsePercent(value: string | undefined | null): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  const hasPercentSign = typeof value === "string" && value.includes("%");
  if (hasPercentSign) return num / 100;
  // Heurística: comissões normalmente ficam entre 0 e 100 quando digitadas
  // sem "%" (ex.: "12" = 12%). Valores já fracionários (<= 1) são mantidos.
  return num > 1 ? num / 100 : num;
}

export function parseIntOrNull(value: string | undefined | null): number | null {
  const num = parseNumber(value);
  if (num === null) return null;
  return Math.round(num);
}

const DATE_PATTERNS = [
  /^(\d{2})\/(\d{2})\/(\d{4})$/, // dd/mm/aaaa
  /^(\d{4})-(\d{2})-(\d{2})$/, // aaaa-mm-dd
];

export function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const ddmmyyyy = DATE_PATTERNS[0].exec(trimmed);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  }

  const isoDate = DATE_PATTERNS[1].exec(trimmed);
  if (isoDate) {
    const [, yyyy, mm, dd] = isoDate;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Aceita "01/2024", "2024-01" ou "Janeiro/2024" e normaliza para dia 1. */
export function parseMonth(value: string | undefined | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();

  const mmYyyy = /^(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (mmYyyy) {
    const [, mm, yyyy] = mmYyyy;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, 1));
  }

  const yyyyMm = /^(\d{4})-(\d{1,2})$/.exec(trimmed);
  if (yyyyMm) {
    const [, yyyy, mm] = yyyyMm;
    return new Date(Date.UTC(Number(yyyy), Number(mm) - 1, 1));
  }

  const asDate = parseDate(trimmed);
  if (asDate) return new Date(Date.UTC(asDate.getUTCFullYear(), asDate.getUTCMonth(), 1));

  const MESES = [
    "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const monthName = /^([a-zÀ-ú]+)\/(\d{4})$/i.exec(trimmed);
  if (monthName) {
    const idx = MESES.indexOf(normalizeHeader(monthName[1]));
    if (idx >= 0) return new Date(Date.UTC(Number(monthName[2]), idx, 1));
  }

  return null;
}
