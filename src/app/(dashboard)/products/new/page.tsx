import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage() {
  const session = await auth();
  const [categories, suppliers] = await Promise.all([getCategories(), getSuppliers()]);

  return (
    <AppShell
      title="New Product"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Add product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
