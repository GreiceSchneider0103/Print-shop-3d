export type DateRange = { from: Date; to: Date };

const STORE_TIMEZONE = "America/Sao_Paulo";

/**
 * "Hoje" no fuso da loja, não no fuso do servidor. O servidor (Vercel) roda
 * em UTC, então usar `new Date()` puro pra decidir o dia corrente falha
 * bastante: São Paulo é UTC-3, então das 21h às 23h59 (hora local) o
 * relógio UTC já virou o dia seguinte, e "hoje"/"faturamento do dia"
 * passavam a apontar pro dia errado nesse intervalo — pedidos feitos essa
 * noite apareciam como "ontem" e "hoje" ficava zerado. `dataVenda` é
 * gravado como meia-noite UTC representando o dia local (ver
 * `sync/parsers.ts` → `parseDate`), então o "hoje" tem que vir do mesmo
 * critério: o dia calendário em São Paulo, não o dia UTC corrente.
 */
function todayInStoreTimezone(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STORE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: "year" | "month" | "day") => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

/** Dia calendário (UTC) — mesma convenção usada pra gravar `dataVenda` no sync. */
export function getDayRange(date: Date): DateRange {
  return { from: startOfDayUTC(date), to: endOfDayUTC(date) };
}

export function getTodayRange(): DateRange {
  return getDayRange(todayInStoreTimezone());
}

export function getYesterdayRange(): DateRange {
  const today = todayInStoreTimezone();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  return getDayRange(yesterday);
}

/** Lê `?from=YYYY-MM-DD&to=YYYY-MM-DD` da URL; sem parâmetros, usa o mês corrente. */
export function getDateRangeFromSearchParams(searchParams: {
  from?: string;
  to?: string;
}): DateRange {
  const now = todayInStoreTimezone();

  const from = searchParams.from ? new Date(`${searchParams.from}T00:00:00Z`) : startOfMonthUTC(now);
  const to = searchParams.to ? new Date(`${searchParams.to}T00:00:00Z`) : now;

  return { from, to: endOfDayUTC(to) };
}

/** Período imediatamente anterior, com a mesma duração — para comparativos. */
export function getPreviousRange({ from, to }: DateRange): DateRange {
  const durationMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom, to: prevTo };
}

export function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function growthPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
