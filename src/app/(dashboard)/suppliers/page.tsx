import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSuppliers } from "@/lib/actions/suppliers";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function SuppliersPage() {
  const session = await auth();
  const suppliers = await getSuppliers();

  return (
    <AppShell title="Suppliers" userName={session?.user?.name} userEmail={session?.user?.email}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierForm />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{suppliers.length} suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Amount owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/suppliers/${s.id}`}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {s.phone || s.contact || "—"}
                    </TableCell>
                    <TableCell>{s._count.products}</TableCell>
                    <TableCell
                      className={
                        decimalToNumber(s.amountOwed) > 0
                          ? "font-medium text-amber-700"
                          : ""
                      }
                    >
                      {formatPKR(decimalToNumber(s.amountOwed))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
