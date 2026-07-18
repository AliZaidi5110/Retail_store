"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { shopSchema, type ShopInput } from "@/lib/validations/shop";
import { createShop, updateShop } from "@/lib/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const empty: ShopInput = {
  shopName: "",
  ownerName: "",
  phone: "",
  address: "",
  cnic: "",
  notes: "",
  openingBalance: 0,
};

export function ShopForm({
  initial,
}: {
  initial?: Partial<ShopInput> & { id?: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<ShopInput>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: initial?.shopName || "",
      ownerName: initial?.ownerName || "",
      phone: initial?.phone || "",
      address: initial?.address || "",
      cnic: initial?.cnic || "",
      notes: initial?.notes || "",
      openingBalance: initial?.openingBalance ?? 0,
    },
  });

  async function onSubmit(values: ShopInput) {
    setPending(true);
    try {
      const result = isEdit
        ? await updateShop(initial!.id!, values)
        : await createShop(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!isEdit) form.reset(empty);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="shopName">Shop name</Label>
        <Input id="shopName" {...form.register("shopName")} autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner name</Label>
        <Input id="ownerName" {...form.register("ownerName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...form.register("phone")} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...form.register("address")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnic">CNIC (optional)</Label>
        <Input id="cnic" placeholder="xxxxx-xxxxxxx-x" {...form.register("cnic")} />
      </div>
      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="openingBalance">Amount owed (PKR)</Label>
          <Input
            id="openingBalance"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            {...form.register("openingBalance")}
          />
          <p className="text-xs text-slate-500">
            Previous credit already outstanding. Leave 0 if starting fresh.
          </p>
        </div>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Update shop" : "Add shop"}
        </Button>
      </div>
    </form>
  );
}
