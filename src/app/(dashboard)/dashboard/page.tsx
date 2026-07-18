import Link from "next/link";
import { format } from "date-fns";
import {
  Package,
  ShoppingCart,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Building2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/actions/dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RevenueExpenseChart, TopProductsChart } from "@/components/dashboard/dashboard-charts";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData();

  const cards = [
    {
      title: "Today's Sales",
      value: formatPKR(data.todayRevenue),
      hint: `${data.todaySalesCount} transactions`,
      icon: ShoppingCart,
    },
    {
      title: "Today's Expenses",
      value: formatPKR(data.todayExpenses),
      hint: "Costs recorded today",
      icon: Wallet,
    },
    {
      title: "Today's Profit / Loss",
      value: formatPKR(data.todayProfit),
      hint:
        data.todayProfit < 0
          ? "Loss alert — expenses exceed contribution"
          : `Gross ${formatPKR(data.todayGrossProfit)}`,
      icon: TrendingUp,
      warn: data.todayProfit < 0,
    },
    {
      title: "Total Stock Value",
      value: formatPKR(data.stockValue),
      hint: `${data.productsCount} products at cost`,
      icon: Package,
    },
  ];

  return (
    <AppShell
      title="Dashboard"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className={card.warn ? "border-red-200" : undefined}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.warn ? "text-red-500" : "text-teal-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${card.warn ? "text-red-600" : ""}`}>
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-amber-900">
                Total Outstanding from Shops
              </CardTitle>
              <CardDescription className="text-amber-800/80">
                Credit khata only — not counted as sales revenue until payment is recorded
              </CardDescription>
            </div>
            <Building2 className="h-5 w-5 text-amber-700" />
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div className="text-3xl font-bold text-amber-800">
              {formatPKR(data.shopsOutstanding)}
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/shops">
                View shops <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueExpenseChart data={data.chartData} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products</CardTitle>
              <CardDescription>By revenue (all time in range)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No sales yet</p>
              ) : (
                <TopProductsChart data={data.topProducts} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Low Stock
                </CardTitle>
                <CardDescription>At or below reorder level</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/products">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.lowStock.length === 0 ? (
                <p className="text-sm text-slate-500">All products are healthy</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reorder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lowStock.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="warning">{p.quantity}</Badge>
                        </TableCell>
                        <TableCell>{p.reorderLevel}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest sales and expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentSales.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{s.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">
                      Sale · {format(s.createdAt, "dd MMM, HH:mm")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    +{formatPKR(decimalToNumber(s.total))}
                  </span>
                </div>
              ))}
              {data.recentExpenses.slice(0, 3).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{e.category.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-500">
                      Expense · {format(e.date, "dd MMM yyyy")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatPKR(decimalToNumber(e.amount))}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
