import type { StockIssueStatus } from "@prisma/client";

export function issueStatus(amountPaid: number, totalAmount: number): StockIssueStatus {
  if (amountPaid <= 0) return "UNPAID";
  if (amountPaid + 0.001 >= totalAmount) return "PAID";
  return "PARTIAL";
}

export function shopLedgerBadge(
  outstanding: number,
  lastIssueDate: Date | null,
  overdueDays = 30
): "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" {
  if (outstanding <= 0) return "PAID";
  if (lastIssueDate) {
    const ageMs = Date.now() - lastIssueDate.getTime();
    if (ageMs > overdueDays * 24 * 60 * 60 * 1000) return "OVERDUE";
  }
  // Has some payments if we can't tell easily — caller can pass hasPartial
  return "UNPAID";
}

export function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}
