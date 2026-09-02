export type DateRange = { from: Date; to: Date };

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

/** Lê `?from=YYYY-MM-DD&to=YYYY-MM-DD` da URL; sem parâmetros, usa o mês corrente. */
export function getDateRangeFromSearchParams(searchParams: {
  from?: string;
  to?: string;
}): DateRange {
  const now = new Date();

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
