/**
 * Utilitários de parsing tolerantes ao formato "planilha brasileira":
 * números com vírgula decimal e ponto de milhar, moeda com "R$", datas
 * dd/mm/aaaa e cabeçalhos com variação de acentuação/espaçamento.
 */

/**
 * Uma linha onde nenhum dos campos-chave (ex.: pedido/SKU/canal) tem valor
 * é normal em planilhas grandes — sobra de formatação/buffer de linhas
 * futuras, não um problema. Sem essa distinção, o contador de "ignorados"
 * do sync mistura essas linhas em branco com linhas que têm dado real mas
 * estão faltando só um campo obrigatório (aí sim vale a pena investigar),
 * e o status "PARTIAL" parece um problema quando na prática é só a aba
 * tendo mais linhas do que pedidos reais.
 *
 * Checa só os campos-chave passados, não a linha inteira: várias abas têm
 * colunas de fórmula/checkbox que sempre têm algum valor (ex.: a coluna
 * checkbox da aba Produção mostra "FALSE" mesmo numa linha totalmente sem
 * dado), o que faria uma checagem "a linha inteira está vazia" nunca bater.
 */
export function allFieldsEmpty(...values: (string | undefined | null)[]): boolean {
  return values.every((value) => !value || value.trim() === "");
}

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
 *
 * Cabeçalhos reais costumam ter texto explicativo colado ao nome do campo
 * ("Custo unitário (CMV)", "Gramas 1 (por unidade)", "Frete pago pelo
 * cliente"). Por isso, quando não há match exato, cai para "contém" nos
 * dois sentidos (alias dentro do cabeçalho, ou cabeçalho dentro do alias)
 * — cobre a maioria das variações sem precisar hardcodar o texto completo
 * de cada cabeçalho.
 */
export function buildRowLookup(row: Record<string, string>) {
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(row)) {
    lookup.set(normalizeHeader(key), value);
  }

  return {
    get(...aliases: string[]): string | undefined {
      for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        const value = lookup.get(normalizedAlias);
        if (value !== undefined && value !== "") return value;
      }

      for (const alias of aliases) {
        const normalizedAlias = normalizeHeader(alias);
        if (!normalizedAlias) continue;
        for (const [key, value] of lookup) {
          // Cabeçalho em branco normaliza para "", que é substring de
          // qualquer alias — sem este skip, uma coluna sem título (comuns
          // em planilhas com colunas auxiliares) "casaria" com tudo.
          if (!key || value === "") continue;
          if (key.includes(normalizedAlias) || normalizedAlias.includes(key)) return value;
        }
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
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // d/m/aaaa ou dd/mm/aaaa
  /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // aaaa-m-d ou aaaa-mm-dd
];

/**
 * Datas vindas do Sheets com `dateTimeRenderOption: FORMATTED_STRING` saem
 * formatadas conforme o locale da planilha (ex.: "2/9/2026" sem zero à
 * esquerda). Tratamos explicitamente como dd/mm/aaaa — nunca cai no
 * `new Date(string)` nativo do JS, que interpretaria como mm/dd/aaaa
 * (formato americano) e inverteria dia e mês silenciosamente.
 */
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

  return null;
}

const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MESES_COMPLETOS = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Aceita "01/2024", "2024-01", "Janeiro/2024" e também "jul./26" (mês
 * abreviado + ano com 2 dígitos, formato real da aba "Fixos" da planilha).
 * Normaliza para o dia 1 do mês.
 */
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

  // "jul./26", "jul/26", "jul./2026" — mês abreviado em pt-BR + ano de 2 ou 4 dígitos
  const abrevMatch = /^([a-zà-ú]{3})\.?\/(\d{2,4})$/i.exec(trimmed);
  if (abrevMatch) {
    const idx = MESES_ABREV.indexOf(normalizeHeader(abrevMatch[1]));
    if (idx >= 0) {
      const anoRaw = Number(abrevMatch[2]);
      const ano = anoRaw < 100 ? 2000 + anoRaw : anoRaw;
      return new Date(Date.UTC(ano, idx, 1));
    }
  }

  // "Janeiro/2024" — nome completo do mês + ano de 4 dígitos
  const monthName = /^([a-zà-ú]+)\/(\d{4})$/i.exec(trimmed);
  if (monthName) {
    const idx = MESES_COMPLETOS.indexOf(normalizeHeader(monthName[1]));
    if (idx >= 0) return new Date(Date.UTC(Number(monthName[2]), idx, 1));
  }

  const asDate = parseDate(trimmed);
  if (asDate) return new Date(Date.UTC(asDate.getUTCFullYear(), asDate.getUTCMonth(), 1));

  return null;
}
