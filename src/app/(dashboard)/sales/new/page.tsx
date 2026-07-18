import { auth } from "@/lib/auth";
import { getProducts } from "@/lib/actions/products";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaleForm } from "@/components/sales/sale-form";
import { decimalToNumber } from "@/lib/utils";

export default async function NewSalePage() {
  const session = await auth();
  const products = await getProducts();

  return (
    <AppShell
      title="Quick Sale"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>New sale</CardTitle>
          <CardDescription>
            Multi-product checkout with discount and automatic stock deduction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SaleForm
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
              sellingPrice: decimalToNumber(p.sellingPrice),
              quantity: p.quantity,
            }))}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
