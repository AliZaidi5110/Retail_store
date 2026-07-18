import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getShop } from "@/lib/actions/shops";
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
import { ShopForm } from "@/components/shops/shop-form";
import { ShopPaymentForm } from "@/components/shops/shop-payment-form";
import { StockReturnForm } from "@/components/shops/stock-return-form";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

function statusBadge(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "PARTIAL") return "warning" as const;
  return "secondary" as const;
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const shop = await getShop(id);
  if (!shop) notFound();

  const ledgerRows = shop.stockIssues.flatMap((issue) => {
    if (issue.items.length === 0) {
      return [
        {
          key: issue.id,
          date: issue.date,
          product: issue.notes || "Opening balance / credit",
          qtyTaken: null as number | null,
          qtyOriginal: 0,
          qtyReturned: 0,
          rate: null as number | null,
          totalAmount: decimalToNumber(issue.totalAmount),
          amountPaid: decimalToNumber(issue.amountPaid),
          amountRemaining: decimalToNumber(issue.amountRemaining),
          status: issue.status,
          issueId: issue.id,
        },
      ];
    }

    return issue.items.map((item) => {
      const qtyTaken = item.quantity - item.quantityReturned;
      const lineTotal = decimalToNumber(item.lineTotal);
      const issueTotal = decimalToNumber(issue.totalAmount) || 1;
      const share = lineTotal / issueTotal;
      const amountPaid = decimalToNumber(issue.amountPaid) * share;
      const amountRemaining = decimalToNumber(issue.amountRemaining) * share;
      return {
        key: item.id,
        date: issue.date,
        product: item.product.name,
        qtyTaken,
        qtyOriginal: item.quantity,
        qtyReturned: item.quantityReturned,
        rate: decimalToNumber(item.ratePerUnit),
        totalAmount: lineTotal,
        amountPaid,
        amountRemaining,
        status: issue.status,
        issueId: issue.id,
      };
    });
  });

  const totalGiven = shop.stockIssues.reduce(
    (s, i) => s + decimalToNumber(i.totalAmount),
    0
  );
  const totalPaid = shop.stockIssues.reduce(
    (s, i) => s + decimalToNumber(i.amountPaid),
    0
  );
  const outstanding = shop.stockIssues.reduce(
    (s, i) => s + decimalToNumber(i.amountRemaining),
    0
  );
  const lastPayment = shop.payments[0]?.datePaid ?? null;

  const openIssues = shop.stockIssues
    .filter((i) => decimalToNumber(i.amountRemaining) > 0)
    .map((i) => ({
      id: i.id,
      dateLabel: format(i.date, "dd MMM yyyy"),
      amountRemaining: decimalToNumber(i.amountRemaining),
    }));

  const returnable = shop.stockIssues.flatMap((issue) =>
    issue.items
      .filter((item) => item.quantity - item.quantityReturned > 0)
      .map((item) => ({
        id: item.id,
        label: `${format(issue.date, "dd MMM")} · ${item.product.name}`,
        maxQty: item.quantity - item.quantityReturned,
      }))
  );

  return (
    <AppShell title={shop.shopName} userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/shops">Back</Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/shops/${shop.id}/issue`}>Issue stock</Link>
        </Button>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total stock value given</CardDescription>
            <CardTitle className="text-xl">{formatPKR(totalGiven)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total paid so far</CardDescription>
            <CardTitle className="text-xl text-teal-800">{formatPKR(totalPaid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Still outstanding</CardDescription>
            <CardTitle className="text-xl text-amber-700">{formatPKR(outstanding)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last payment</CardDescription>
            <CardTitle className="text-xl">
              {lastPayment ? format(lastPayment, "dd MMM yyyy") : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Running ledger (khata)</CardTitle>
          <CardDescription>
            Stock given on credit — revenue is counted only when payment is recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty Taken</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500">
                    No stock issued yet
                  </TableCell>
                </TableRow>
              ) : (
                ledgerRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>{format(row.date, "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {row.product}
                      {row.qtyReturned > 0 && (
                        <span className="block text-xs text-slate-500">
                          returned {row.qtyReturned} of {row.qtyOriginal}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{row.qtyTaken ?? "—"}</TableCell>
                    <TableCell>{row.rate == null ? "—" : formatPKR(row.rate)}</TableCell>
                    <TableCell>{formatPKR(row.totalAmount)}</TableCell>
                    <TableCell>{formatPKR(row.amountPaid)}</TableCell>
                    <TableCell className="font-medium text-amber-700">
                      {formatPKR(row.amountRemaining)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge(row.status)}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>Counts as real revenue only when paid</CardDescription>
          </CardHeader>
          <CardContent>
            <ShopPaymentForm
              shopId={shop.id}
              outstanding={outstanding}
              openIssues={openIssues}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record return</CardTitle>
            <CardDescription>Unsold stock back to main inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <StockReturnForm items={returnable} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shop profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopForm
              initial={{
                id: shop.id,
                shopName: shop.shopName,
                ownerName: shop.ownerName,
                phone: shop.phone,
                address: shop.address,
                cnic: shop.cnic,
                notes: shop.notes,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
          </CardHeader>
          <CardContent>
            {shop.payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shop.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(p.datePaid, "dd MMM yyyy")}</TableCell>
                      <TableCell className="font-medium text-teal-800">
                        {formatPKR(decimalToNumber(p.amountPaid))}
                      </TableCell>
                      <TableCell>{p.paymentMethod}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
