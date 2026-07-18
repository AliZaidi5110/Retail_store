import { auth } from "@/lib/auth";
import { getCategories } from "@/lib/actions/categories";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryManager } from "@/components/products/category-manager";

export default async function CategoriesPage() {
  const session = await auth();
  const categories = await getCategories();

  return (
    <AppShell
      title="Categories"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Product categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
