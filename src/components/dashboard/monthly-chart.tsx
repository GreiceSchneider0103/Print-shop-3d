"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrencyBRL, formatMonth } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/monthly";

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
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
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrencyBRL(v)} width={90} />
          <Tooltip
            formatter={(value) => formatCurrencyBRL(Number(value))}
            labelFormatter={(value) => (typeof value === "string" ? formatMonth(`${value}-01`) : value)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="faturamento" name="Faturamento" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="margem" name="Margem" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lucroLiquido" name="Lucro líquido" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
