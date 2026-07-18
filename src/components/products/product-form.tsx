"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

type ProductFormProps = {
  categories: Option[];
  suppliers: Option[];
  initial?: Partial<ProductInput> & { id?: string };
};

export function ProductForm({ categories, suppliers, initial }: ProductFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isEdit = Boolean(initial?.id);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name || "",
      sku: initial?.sku || "",
      barcode: initial?.barcode || "",
      categoryId: initial?.categoryId || "",
      purchasePrice: initial?.purchasePrice ?? 0,
      sellingPrice: initial?.sellingPrice ?? 0,
      quantity: initial?.quantity ?? 0,
      reorderLevel: initial?.reorderLevel ?? 5,
      unit: initial?.unit || "PCS",
      supplierId: initial?.supplierId || "",
      image: initial?.image || "",
    },
  });

  async function onSubmit(values: ProductInput) {
    setPending(true);
    try {
      const payload = {
        ...values,
        supplierId: values.supplierId || null,
        barcode: values.barcode || null,
        image: values.image || null,
      };
      const result = isEdit
        ? await updateProduct(initial!.id!, payload)
        : await createProduct(payload);

      if (!result.success) {
        toast.error(result.message || "Failed");
        return;
      }
      toast.success(result.message);
      router.push(isEdit ? `/products/${initial!.id}` : "/products");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Product name</Label>
          <Input id="name" {...form.register("name")} autoFocus />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...form.register("sku")} />
          {form.formState.errors.sku && (
            <p className="text-xs text-red-600">{form.formState.errors.sku.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode</Label>
          <Input id="barcode" {...form.register("barcode")} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.watch("categoryId")}
            onValueChange={(v) => form.setValue("categoryId", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.categoryId && (
            <p className="text-xs text-red-600">{form.formState.errors.categoryId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select
            value={form.watch("supplierId") || "none"}
            onValueChange={(v) =>
              form.setValue("supplierId", v === "none" ? "" : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price (PKR)</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            {...form.register("purchasePrice")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sellingPrice">Selling price (PKR)</Label>
          <Input
            id="sellingPrice"
            type="number"
            step="0.01"
            {...form.register("sellingPrice")}
          />
        </div>
        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="quantity">Opening quantity</Label>
            <Input id="quantity" type="number" {...form.register("quantity")} />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder level</Label>
          <Input id="reorderLevel" type="number" {...form.register("reorderLevel")} />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={form.watch("unit")}
            onValueChange={(v) => form.setValue("unit", v as ProductInput["unit"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PCS">PCS</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="BOX">BOX</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Update product" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
