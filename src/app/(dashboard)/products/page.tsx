import Link from "next/link";
import { Plus, Upload, Tags } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(params.q, params.category),
    getCategories(),
  ]);

  return (
    <AppShell title="Products" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              name="q"
              placeholder="Search name, SKU, barcode..."
              defaultValue={params.q || ""}
              className="max-w-sm"
            />
            <select
              name="category"
              defaultValue={params.category || ""}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Filter
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/products/categories">
                <Tags className="mr-1 h-4 w-4" /> Categories
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/products/import">
                <Upload className="mr-1 h-4 w-4" /> Import
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/products/new">
                <Plus className="mr-1 h-4 w-4" /> New product
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{products.length} products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Selling</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-500">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const low = p.quantity <= p.reorderLevel;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            href={`/products/${p.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell>{p.category.name}</TableCell>
                        <TableCell>
                          <Badge variant={low ? "warning" : "secondary"}>
                            {p.quantity} {p.unit}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPKR(decimalToNumber(p.purchasePrice))}</TableCell>
                        <TableCell>{formatPKR(decimalToNumber(p.sellingPrice))}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
