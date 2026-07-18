import { auth } from "@/lib/auth";
import { getSalesReportData } from "@/lib/actions/reports";
import { getSettings } from "@/lib/actions/settings";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SalesExportButtons } from "@/components/reports/export-buttons";
import { formatPKR } from "@/lib/currency";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const [report, settings] = await Promise.all([
    getSalesReportData(params.from, params.to),
    getSettings(),
  ]);

  const { summary, sales, expenses, periodLabel } = report;

  return (
    <AppShell title="Reports" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="space-y-4 print:space-y-3">
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Business report</CardTitle>
            <CardDescription>
              Daily / weekly / monthly or custom range — sales, expenses, and net profit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="from">
                  From
                </label>
                <Input id="from" name="from" type="date" defaultValue={params.from || ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="to">
                  To
                </label>
                <Input id="to" name="to" type="date" defaultValue={params.to || ""} />
              </div>
              <Button type="submit">Apply</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sales revenue</CardDescription>
              <CardTitle className="text-xl">{formatPKR(summary.revenue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              {summary.salesCount} transactions
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expenses</CardDescription>
              <CardTitle className="text-xl">{formatPKR(summary.expenseTotal)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">
              {summary.expenseCount} entries · COGS {formatPKR(summary.cogs)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gross profit</CardDescription>
              <CardTitle className="text-xl">{formatPKR(summary.grossProfit)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">Revenue − COGS</CardContent>
          </Card>
          <Card className={summary.netProfit < 0 ? "border-red-200" : undefined}>
            <CardHeader className="pb-2">
              <CardDescription>Net profit / loss</CardDescription>
              <CardTitle
                className={`text-xl ${summary.netProfit < 0 ? "text-red-600" : "text-teal-800"}`}
              >
                {formatPKR(summary.netProfit)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500">{periodLabel}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">{settings.storeName}</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </div>
            <SalesExportButtons
              sales={sales}
              expenses={expenses}
              summary={{ ...summary, periodLabel }}
              storeName={settings.storeName}
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Sales</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500">
                        No sales in this range
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((r) => (
                      <TableRow key={r.invoiceNumber}>
                        <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.paymentMethod}</TableCell>
                        <TableCell>{r.items}</TableCell>
                        <TableCell>{formatPKR(r.discount)}</TableCell>
                        <TableCell className="font-medium">{formatPKR(r.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Expenses</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500">
                        No expenses in this range
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((e, idx) => (
                      <TableRow key={`${e.date}-${idx}`}>
                        <TableCell>{e.date}</TableCell>
                        <TableCell>{e.category.replace(/_/g, " ")}</TableCell>
                        <TableCell>{e.description || "—"}</TableCell>
                        <TableCell className="font-medium">{formatPKR(e.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
