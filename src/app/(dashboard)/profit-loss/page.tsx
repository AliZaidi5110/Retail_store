import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProfitLossReport, type ReportPeriod } from "@/lib/actions/reports";
import { getSettings } from "@/lib/actions/settings";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProfitLossExportButtons } from "@/components/reports/export-buttons";
import { ExpensePieChart } from "@/components/expenses/expense-charts";
import { formatPKR } from "@/lib/currency";

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    date?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const period = (params.period as ReportPeriod) || "monthly";

  const [report, settings] = await Promise.all([
    getProfitLossReport({
      period,
      date: params.date,
      from: params.from,
      to: params.to,
    }),
    getSettings(),
  ]);

  return (
    <AppShell
      title="Profit & Loss"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <div className="space-y-4">
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Period</CardTitle>
            <CardDescription>Daily, monthly, yearly, or custom range</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col flex-wrap gap-3 sm:flex-row sm:items-end">
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="period">
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  defaultValue={period}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="date">
                  Anchor date
                </label>
                <Input id="date" name="date" type="date" defaultValue={params.date || ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="from">
                  From (custom)
                </label>
                <Input id="from" name="from" type="date" defaultValue={params.from || ""} />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="to">
                  To (custom)
                </label>
                <Input id="to" name="to" type="date" defaultValue={params.to || ""} />
              </div>
              <Button type="submit">Generate</Button>
            </form>
          </CardContent>
        </Card>

        {report.isLoss && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Loss alert</p>
              <p className="text-sm">
                Net result for this period is {formatPKR(report.netProfit)}. Review expenses and
                margins.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{settings.storeName}</h2>
            <p className="text-sm text-slate-500">{report.periodLabel}</p>
          </div>
          <ProfitLossExportButtons
            storeName={settings.storeName}
            summary={{
              periodLabel: report.periodLabel,
              revenue: report.revenue,
              cogs: report.cogs,
              grossProfit: report.grossProfit,
              expenseTotal: report.expenseTotal,
              netProfit: report.netProfit,
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Revenue", value: report.revenue },
            { label: "COGS", value: report.cogs },
            { label: "Gross Profit", value: report.grossProfit },
            { label: "Expenses", value: report.expenseTotal },
            { label: "Net Profit", value: report.netProfit, highlight: true },
          ].map((item) => (
            <Card
              key={item.label}
              className={
                item.highlight && report.isLoss ? "border-red-200" : undefined
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-xl font-bold ${
                    item.highlight
                      ? report.isLoss
                        ? "text-red-600"
                        : "text-emerald-700"
                      : ""
                  }`}
                >
                  {formatPKR(item.value)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense mix</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensePieChart data={report.expenseByCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Sales count</span>
                <Badge variant="secondary">{report.salesCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Discounts given</span>
                <span>{formatPKR(report.discounts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross margin</span>
                <span>
                  {report.revenue > 0
                    ? `${((report.grossProfit / report.revenue) * 100).toFixed(1)}%`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Net result</span>
                <span className={report.isLoss ? "text-red-600" : "text-emerald-700"}>
                  {report.isLoss ? "LOSS" : "PROFIT"} · {formatPKR(report.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Gross</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.saleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500">
                      No sales in this period
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.values(
                    report.saleItems.reduce<
                      Record<
                        string,
                        {
                          productName: string;
                          quantity: number;
                          revenue: number;
                          cost: number;
                        }
                      >
                    >((acc, item) => {
                      const key = item.productName;
                      if (!acc[key]) {
                        acc[key] = {
                          productName: item.productName,
                          quantity: 0,
                          revenue: 0,
                          cost: 0,
                        };
                      }
                      acc[key].quantity += item.quantity;
                      acc[key].revenue += item.revenue;
                      acc[key].cost += item.cost;
                      return acc;
                    }, {})
                  ).map((row) => (
                    <TableRow key={row.productName}>
                      <TableCell>{row.productName}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{formatPKR(row.revenue)}</TableCell>
                      <TableCell>{formatPKR(row.cost)}</TableCell>
                      <TableCell className="font-medium">
                        {formatPKR(row.revenue - row.cost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
