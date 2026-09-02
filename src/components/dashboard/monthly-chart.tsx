"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrencyBRL } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/queries/monthly";

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => formatCurrencyBRL(v)} width={90} />
          <Tooltip formatter={(value) => formatCurrencyBRL(Number(value))} />
          <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="margem" name="Margem" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="lucroLiquido" name="Lucro líquido" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
