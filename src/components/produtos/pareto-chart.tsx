"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrencyBRL, formatPercent } from "@/lib/format";
import type { ProductAnalysis } from "@/lib/queries/products";

const CLASSE_COLOR: Record<ProductAnalysis["classe"], string> = {
  A: "var(--chart-2)",
  B: "var(--chart-4)",
  C: "var(--muted-foreground)",
};

export function ParetoChart({ data }: { data: ProductAnalysis[] }) {
  const top = data.slice(0, 15).map((p) => ({ ...p, label: p.sku }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={top} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={70} />
          <YAxis
            yAxisId="margem"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrencyBRL(v)}
            width={90}
            // Sempre inclui o zero no eixo — sem isso, quando todos os produtos
            // têm margem negativa, o gráfico auto-escala só entre os valores
            // negativos e as barras parecem crescer "pra cima" de forma
            // enganosa, em vez de descer a partir de zero.
            domain={([dataMin, dataMax]: readonly [number, number]) => [Math.min(0, dataMin), Math.max(0, dataMax)]}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => formatPercent(v, 0)}
            domain={[0, 1]}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Acumulado" ? formatPercent(Number(value)) : formatCurrencyBRL(Number(value))
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="margem" dataKey="margem" name="Margem" radius={[4, 4, 0, 0]}>
            {top.map((entry) => (
              <Cell key={entry.sku} fill={CLASSE_COLOR[entry.classe]} />
            ))}
          </Bar>
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="cumulativoPct"
            name="Acumulado"
            stroke="var(--foreground)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
