import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getShops } from "@/lib/actions/shops";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ShopForm } from "@/components/shops/shop-form";
import { formatPKR } from "@/lib/currency";

function badgeVariant(badge: string) {
  if (badge === "PAID") return "success" as const;
  if (badge === "PARTIAL") return "warning" as const;
  if (badge === "OVERDUE") return "destructive" as const;
  return "secondary" as const;
}

export default async function ShopsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const shops = await getShops(q);

  return (
    <AppShell title="Shops / Consignees" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add shop</CardTitle>
          </CardHeader>
          <CardContent>
            <ShopForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">
              Credit ledger (khata) — sorted by highest outstanding
            </CardTitle>
            <form className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="q"
                placeholder="Search shop name or phone"
                defaultValue={q || ""}
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Last issue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500">
                      No shops yet — add one to start a credit ledger
                    </TableCell>
                  </TableRow>
                ) : (
                  shops.map((shop) => (
                    <TableRow key={shop.id}>
                      <TableCell>
                        <Link
                          href={`/shops/${shop.id}`}
                          className="font-medium text-teal-700 hover:underline"
                        >
                          {shop.shopName}
                        </Link>
                        <p className="text-xs text-slate-500">{shop.ownerName}</p>
                      </TableCell>
                      <TableCell>{shop.phone || "—"}</TableCell>
                      <TableCell
                        className={
                          shop.outstanding > 0 ? "font-semibold text-amber-700" : ""
                        }
                      >
                        {formatPKR(shop.outstanding)}
                      </TableCell>
                      <TableCell>
                        {shop.lastIssueDate
                          ? format(shop.lastIssueDate, "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant(shop.badge)}>{shop.badge}</Badge>
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
