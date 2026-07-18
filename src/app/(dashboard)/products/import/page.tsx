import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportForm } from "@/components/products/import-form";

export default async function ImportProductsPage() {
  const session = await auth();

  return (
    <AppShell
      title="Import Products"
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Bulk import</CardTitle>
          <CardDescription>
            Import products from CSV or Excel. Existing SKUs are updated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
