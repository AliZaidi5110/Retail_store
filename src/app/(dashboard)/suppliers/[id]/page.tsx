import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSupplier } from "@/lib/actions/suppliers";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { formatPKR } from "@/lib/currency";
import { decimalToNumber } from "@/lib/utils";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  return (
    <AppShell
      title={supplier.name}
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/suppliers">Back</Link>
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier details</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierForm
              initial={{
                id: supplier.id,
                name: supplier.name,
                contact: supplier.contact,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                amountOwed: decimalToNumber(supplier.amountOwed),
                notes: supplier.notes,
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Purchase history (linked products)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500">
              Amount owed:{" "}
              <span className="font-semibold text-amber-700">
                {formatPKR(decimalToNumber(supplier.amountOwed))}
              </span>
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-slate-500">
                      No products linked
                    </TableCell>
                  </TableRow>
                ) : (
                  supplier.products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/products/${p.id}`}
                          className="text-teal-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>{p.category.name}</TableCell>
                      <TableCell>
                        {formatPKR(decimalToNumber(p.purchasePrice))}
                      </TableCell>
                      <TableCell>
                        {p.quantity} {p.unit}
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
