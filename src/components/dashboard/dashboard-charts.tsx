"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { formatPKR } from "@/lib/currency";

type ChartPoint = {
  label: string;
  revenue: number;
  expenses: number;
};

type TopProduct = {
  name: string;
  revenue: number;
  quantity: number;
};

export function RevenueExpenseChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            formatter={(value: number) => formatPKR(value)}
            contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#0d9488"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            formatter={(value: number) => formatPKR(value)}
            contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
