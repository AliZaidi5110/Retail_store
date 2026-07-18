import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getExpenses, getExpenseBreakdown } from "@/lib/actions/expenses";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpensePieChart } from "@/components/expenses/expense-charts";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

export default async function ExpensesPage() {
  const session = await auth();
  const [expenses, breakdown] = await Promise.all([
    getExpenses(100),
    getExpenseBreakdown(),
  ]);

  return (
    <AppShell title="Expenses" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-1 h-4 w-4" /> Add expense
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensePieChart data={breakdown} />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{expenses.length} expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        No expenses recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{format(e.date, "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {e.category.replace(/_/g, " ")}
                          </Badge>
                          {e.isRecurring && (
                            <Badge variant="outline" className="ml-1">
                              {e.recurringInterval || "recurring"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {e.description || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-red-700">
                          {formatPKR(decimalToNumber(e.amount))}
                        </TableCell>
                        <TableCell>
                          <DeleteExpenseButton id={e.id} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
