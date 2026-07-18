"use server";

import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  format,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decimalToNumber } from "@/lib/utils";

export type ReportPeriod = "daily" | "monthly" | "yearly" | "custom";

export async function getProfitLossReport(params: {
  period: ReportPeriod;
  date?: string;
  from?: string;
  to?: string;
}) {
  await auth();

  let from: Date;
  let to: Date;
  const base = params.date ? new Date(params.date) : new Date();

  switch (params.period) {
    case "daily":
      from = startOfDay(base);
      to = endOfDay(base);
      break;
    case "monthly":
      from = startOfMonth(base);
      to = endOfMonth(base);
      break;
    case "yearly":
      from = startOfYear(base);
      to = endOfYear(base);
      break;
    case "custom":
      from = startOfDay(params.from ? new Date(params.from) : subDays(new Date(), 30));
      to = endOfDay(params.to ? new Date(params.to) : new Date());
      break;
    default:
      from = startOfMonth(base);
      to = endOfMonth(base);
  }

  const [sales, expenses, saleItems] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: "desc" },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: from, lte: to } } },
      include: { product: true },
    }),
  ]);

  const revenue = sales.reduce((s, sale) => s + decimalToNumber(sale.total), 0);
  const discounts = sales.reduce((s, sale) => s + decimalToNumber(sale.discount), 0);
  const cogs = saleItems.reduce(
    (s, item) => s + decimalToNumber(item.purchasePrice) * item.quantity,
    0
  );
  const expenseTotal = expenses.reduce((s, e) => s + decimalToNumber(e.amount), 0);
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenseTotal;
  const isLoss = netProfit < 0;

  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + decimalToNumber(e.amount);
    return acc;
  }, {});

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    periodLabel: `${format(from, "dd MMM yyyy")} – ${format(to, "dd MMM yyyy")}`,
    revenue,
    discounts,
    cogs,
    grossProfit,
    expenseTotal,
    netProfit,
    isLoss,
    salesCount: sales.length,
    expenses,
    sales,
    expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
    })),
    saleItems: saleItems.map((i) => ({
      productName: i.product.name,
      quantity: i.quantity,
      revenue: decimalToNumber(i.total),
      cost: decimalToNumber(i.purchasePrice) * i.quantity,
    })),
  };
}

export async function getSalesReportData(from?: string, to?: string) {
  await auth();
  const start = from ? startOfDay(new Date(from)) : startOfDay(subDays(new Date(), 30));
  const end = to ? endOfDay(new Date(to)) : endOfDay(new Date());

  const [sales, expenses, saleItems] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: start, lte: end } } },
      select: { purchasePrice: true, quantity: true },
    }),
  ]);

  const revenue = sales.reduce((s, sale) => s + decimalToNumber(sale.total), 0);
  const expenseTotal = expenses.reduce((s, e) => s + decimalToNumber(e.amount), 0);
  const cogs = saleItems.reduce(
    (s, i) => s + decimalToNumber(i.purchasePrice) * i.quantity,
    0
  );
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenseTotal;

  return {
    periodLabel: `${format(start, "dd MMM yyyy")} – ${format(end, "dd MMM yyyy")}`,
    summary: {
      revenue,
      expenseTotal,
      cogs,
      grossProfit,
      netProfit,
      salesCount: sales.length,
      expenseCount: expenses.length,
    },
    sales: sales.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      date: format(s.createdAt, "yyyy-MM-dd HH:mm"),
      paymentMethod: s.paymentMethod,
      subtotal: decimalToNumber(s.subtotal),
      discount: decimalToNumber(s.discount),
      total: decimalToNumber(s.total),
      items: s.items.length,
    })),
    expenses: expenses.map((e) => ({
      date: format(e.date, "yyyy-MM-dd"),
      category: e.category,
      description: e.description || "",
      amount: decimalToNumber(e.amount),
    })),
  };
}
