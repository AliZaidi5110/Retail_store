"use server";

import { startOfDay, subDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decimalToNumber } from "@/lib/utils";

export async function getDashboardData() {
  await auth();
  const now = new Date();
  const from30 = startOfDay(subDays(now, 29));
  const todayStart = startOfDay(now);

  const [
    productsCount,
    allProducts,
    todaySales,
    todayExpensesAgg,
    todayCogsItems,
    monthSales,
    monthExpenses,
    recentSales,
    recentExpenses,
    salesLast30,
    expensesLast30,
    topProductsRaw,
    cogsItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.findMany({
      include: { category: true },
      orderBy: { quantity: "asc" },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: todayStart } },
      _sum: { amount: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: todayStart } } },
      select: { purchasePrice: true, quantity: true },
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: from30 } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: from30 } },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: from30 } },
      select: { createdAt: true, total: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: from30 } },
      select: { date: true, amount: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: from30 } } },
      select: { purchasePrice: true, quantity: true },
    }),
  ]);

  const lowStock = allProducts.filter((p) => p.quantity <= p.reorderLevel).slice(0, 8);

  const dayKeys: string[] = [];
  for (let i = 29; i >= 0; i--) {
    dayKeys.push(format(subDays(now, i), "yyyy-MM-dd"));
  }

  const revenueMap = new Map(dayKeys.map((d) => [d, 0]));
  const expenseMap = new Map(dayKeys.map((d) => [d, 0]));

  for (const s of salesLast30) {
    const key = format(s.createdAt, "yyyy-MM-dd");
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) || 0) + decimalToNumber(s.total));
    }
  }
  for (const e of expensesLast30) {
    const key = format(e.date, "yyyy-MM-dd");
    if (expenseMap.has(key)) {
      expenseMap.set(key, (expenseMap.get(key) || 0) + decimalToNumber(e.amount));
    }
  }

  const chartData = dayKeys.map((date) => ({
    date,
    label: format(new Date(date), "MMM d"),
    revenue: revenueMap.get(date) || 0,
    expenses: expenseMap.get(date) || 0,
  }));

  const productIds = topProductsRaw.map((t) => t.productId);
  const productNames = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

  const topProducts = topProductsRaw.map((t) => ({
    productId: t.productId,
    name: nameMap.get(t.productId) || "Unknown",
    quantity: t._sum.quantity || 0,
    revenue: decimalToNumber(t._sum.total),
  }));

  const todayRevenue = decimalToNumber(todaySales._sum.total);
  const todayExpenses = decimalToNumber(todayExpensesAgg._sum.amount);
  const todayCogs = todayCogsItems.reduce(
    (s, i) => s + decimalToNumber(i.purchasePrice) * i.quantity,
    0
  );
  const todayGrossProfit = todayRevenue - todayCogs;
  const todayProfit = todayGrossProfit - todayExpenses;

  const stockValue = allProducts.reduce(
    (s, p) => s + decimalToNumber(p.purchasePrice) * p.quantity,
    0
  );

  const revenue30 = decimalToNumber(monthSales._sum.total);
  const expenses30 = decimalToNumber(monthExpenses._sum.amount);
  const cogs = cogsItems.reduce(
    (s, i) => s + decimalToNumber(i.purchasePrice) * i.quantity,
    0
  );
  const grossProfit = revenue30 - cogs;
  const netProfit = grossProfit - expenses30;

  return {
    productsCount,
    lowStock,
    todayRevenue,
    todayExpenses,
    todayProfit,
    todayGrossProfit,
    todaySalesCount: todaySales._count,
    stockValue,
    revenue30,
    salesCount30: monthSales._count,
    expenses30,
    grossProfit,
    netProfit,
    chartData,
    topProducts,
    recentSales,
    recentExpenses,
  };
}
