"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validations/expense";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";
import { decimalToNumber } from "@/lib/utils";

export async function getExpenses(limit = 100) {
  await auth();
  return prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createExpense(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid expense" };
  }

  await prisma.expense.create({
    data: {
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      date: new Date(parsed.data.date),
      receiptUrl: parsed.data.receiptUrl || null,
      isRecurring: parsed.data.isRecurring,
      recurringInterval: parsed.data.isRecurring
        ? parsed.data.recurringInterval || "monthly"
        : null,
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/profit-loss");
  return { success: true, message: "Expense recorded" };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/profit-loss");
  return { success: true, message: "Expense deleted" };
}

export async function getExpenseBreakdown() {
  await auth();
  const expenses = await prisma.expense.findMany();
  const map = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category;
    map.set(key, (map.get(key) || 0) + decimalToNumber(e.amount));
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
