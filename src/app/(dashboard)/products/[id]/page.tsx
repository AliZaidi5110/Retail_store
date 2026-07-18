import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getSuppliers } from "@/lib/actions/suppliers";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProductForm } from "@/components/products/product-form";
import { StockForm } from "@/components/products/stock-form";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const [product, categories, suppliers] = await Promise.all([
    getProduct(id),
    getCategories(),
    getSuppliers(),
  ]);

  if (!product) notFound();

  const low = product.quantity <= product.reorderLevel;

  return (
    <AppShell
      title={product.name}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={low ? "warning" : "success"}>
              Stock: {product.quantity} {product.unit}
            </Badge>
            <Badge variant="secondary">{product.category.name}</Badge>
            <span className="text-sm text-slate-500">
              Sell {formatPKR(decimalToNumber(product.sellingPrice))} · Cost{" "}
              {formatPKR(decimalToNumber(product.purchasePrice))}
            </span>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/products">Back</Link>
            </Button>
            <DeleteProductButton id={product.id} name={product.name} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit product</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductForm
                categories={categories.map((c) => ({ id: c.id, name: c.name }))}
                suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
                initial={{
                  id: product.id,
                  name: product.name,
                  sku: product.sku,
                  barcode: product.barcode,
                  categoryId: product.categoryId,
                  purchasePrice: decimalToNumber(product.purchasePrice),
                  sellingPrice: decimalToNumber(product.sellingPrice),
                  quantity: product.quantity,
                  reorderLevel: product.reorderLevel,
                  unit: product.unit,
                  supplierId: product.supplierId,
                  image: product.image,
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock IN / OUT</CardTitle>
              </CardHeader>
              <CardContent>
                <StockForm productId={product.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent movements</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.stockMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-slate-500">
                          No movements yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      product.stockMovements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">
                            {format(m.createdAt, "dd MMM HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={m.type === "IN" ? "success" : "warning"}>
                              {m.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{m.quantity}</TableCell>
                          <TableCell className="text-xs">{m.reason}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
