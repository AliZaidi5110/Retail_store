"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatPKR } from "@/lib/currency";

const COLORS = ["#0d9488", "#0f766e", "#f59e0b", "#64748b", "#14b8a6", "#334155"];

export function ExpensePieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No expense data yet</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    name: d.name.replace(/_/g, " "),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            }
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatPKR(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
