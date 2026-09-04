"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrencyBRL, formatMonth } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/monthly";

const LEGEND_ITEMS = [
  { label: "Faturamento", color: "var(--chart-1)" },
  { label: "Margem", color: "var(--chart-2)" },
  { label: "Lucro líquido", color: "var(--chart-3)" },
];

/**
 * Recharts monta o payload da Legend a partir da ordem interna de
 * registro dos `Bar` (que não bate com a ordem no JSX), então a legenda
 * saía "Faturamento, Lucro líquido, Margem" mesmo com os `Bar` na ordem
 * certa — renderiza a legenda na mão pra garantir a ordem pedida.
 */
function ChartLegend() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function MonthlyChart({ data, metaMensal }: { data: MonthlyPoint[]; metaMensal?: number }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickFormatter={(value: string) => formatMonth(`${value}-01`)}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrencyBRL(v)}
            width={90}
            domain={([dataMin, dataMax]: readonly [number, number]) => [Math.min(0, dataMin), Math.max(0, dataMax)]}
          />
          <Tooltip
            formatter={(value) => formatCurrencyBRL(Number(value))}
            labelFormatter={(value) => (typeof value === "string" ? formatMonth(`${value}-01`) : value)}
          />
          <Legend content={<ChartLegend />} />
          <Bar dataKey="faturamento" name="Faturamento" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="margem" name="Margem" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lucroLiquido" name="Lucro líquido" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
          {!!metaMensal && (
            <ReferenceLine
              y={metaMensal}
              stroke="var(--foreground)"
              strokeDasharray="4 4"
              label={{ value: "Meta", position: "insideTopRight", fontSize: 12 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
