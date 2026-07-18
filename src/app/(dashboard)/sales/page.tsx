import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getSales } from "@/lib/actions/sales";
import { getProducts } from "@/lib/actions/products";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    paymentMethod?: string;
    productId?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const [sales, products] = await Promise.all([
    getSales(100, params),
    getProducts(),
  ]);

  const filteredTotal = sales.reduce((s, sale) => s + decimalToNumber(sale.total), 0);

  return (
    <AppShell title="Sales" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="mr-1 h-4 w-4" /> Quick sale
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
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
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="paymentMethod">
                  Payment
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  defaultValue={params.paymentMethod || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">All methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600" htmlFor="productId">
                  Product
                </label>
                <select
                  id="productId"
                  name="productId"
                  defaultValue={params.productId || ""}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">All products</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Apply
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/sales">Clear</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{sales.length} sales</CardTitle>
            <p className="text-sm font-semibold text-teal-800">
              Total {formatPKR(filteredTotal)}
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      No sales match these filters
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        {s.invoiceNumber}
                      </TableCell>
                      <TableCell>{format(s.createdAt, "dd MMM yyyy HH:mm")}</TableCell>
                      <TableCell>
                        {s.items.map((i) => i.product.name).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{s.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>{formatPKR(decimalToNumber(s.discount))}</TableCell>
                      <TableCell className="font-semibold text-teal-800">
                        {formatPKR(decimalToNumber(s.total))}
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
