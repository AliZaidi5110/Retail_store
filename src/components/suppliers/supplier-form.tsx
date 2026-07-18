"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupplierForm({
  initial,
}: {
  initial?: Partial<SupplierInput> & { id?: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: initial?.name || "",
      contact: initial?.contact || "",
      email: initial?.email || "",
      phone: initial?.phone || "",
      address: initial?.address || "",
      amountOwed: initial?.amountOwed ?? 0,
      notes: initial?.notes || "",
    },
  });

  async function onSubmit(values: SupplierInput) {
    setPending(true);
    try {
      const result = isEdit
        ? await updateSupplier(initial!.id!, values)
        : await createSupplier(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(isEdit ? `/suppliers/${initial!.id}` : "/suppliers");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Supplier name</Label>
        <Input id="name" {...form.register("name")} autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact person</Label>
        <Input id="contact" {...form.register("contact")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amountOwed">Amount owed (PKR)</Label>
        <Input
          id="amountOwed"
          type="number"
          step="0.01"
          min={0}
          {...form.register("amountOwed")}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...form.register("address")} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Update supplier" : "Add supplier"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
