import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getShop } from "@/lib/actions/shops";
import { getProducts } from "@/lib/actions/products";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IssueStockForm } from "@/components/shops/issue-stock-form";
import { decimalToNumber } from "@/lib/utils";

export default async function IssueStockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const [shop, products] = await Promise.all([getShop(id), getProducts()]);
  if (!shop) notFound();

  return (
    <AppShell
      title={`Issue stock — ${shop.shopName}`}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/shops/${shop.id}`}>Back to ledger</Link>
        </Button>
      </div>
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Issue stock on credit</CardTitle>
          <CardDescription>
            Inventory is deducted now. Amount is outstanding until a payment is recorded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueStockForm
            shopId={shop.id}
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sellingPrice: decimalToNumber(p.sellingPrice),
              quantity: p.quantity,
              unit: p.unit,
            }))}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
