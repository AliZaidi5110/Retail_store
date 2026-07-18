import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default async function NewExpensePage() {
  const session = await auth();

  return (
    <AppShell
      title="New Expense"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Record expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
