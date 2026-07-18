"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { createSale } from "@/lib/actions/sales";
import { formatPKR } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
};

type Line = {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
};

export function SaleForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([
    { key: "1", productId: "", quantity: 1, unitPrice: 0, discount: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "ONLINE">("CASH");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity - (l.discount || 0), 0),
    [lines]
  );
  const total = Math.max(0, subtotal - discount);

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, ...patch };
        if (patch.productId) {
          const p = products.find((x) => x.id === patch.productId);
          if (p) next.unitPrice = p.sellingPrice;
        }
        return next;
      })
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: String(Date.now()),
        productId: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
      },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await createSale({
        items: lines.map(({ productId, quantity, unitPrice, discount: d }) => ({
          productId,
          quantity,
          unitPrice,
          discount: d,
        })),
        discount,
        paymentMethod,
        notes: notes || null,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Sale recorded");
      router.push("/sales");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const product = products.find((p) => p.id === line.productId);
          return (
            <div
              key={line.key}
              className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12"
            >
              <div className="space-y-1 sm:col-span-5">
                <Label>Product {idx + 1}</Label>
                <Select
                  value={line.productId || undefined}
                  onValueChange={(v) => updateLine(line.key, { productId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.quantity <= 0}>
                        {p.name} ({p.quantity} left) · {formatPKR(p.sellingPrice)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Qty</Label>
                <Input
                  type="number"
                  min={1}
                  max={product?.quantity || 9999}
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.key, { quantity: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Unit price</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(line.key, { unitPrice: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>Line disc.</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.discount}
                  onChange={(e) =>
                    updateLine(line.key, { discount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.key)}
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          );
        })}
        <Button type="button" variant="outline" size="sm" onClick={addLine}>
          <Plus className="mr-1 h-4 w-4" /> Add product
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Payment method</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="discount">Invoice discount (PKR)</Label>
          <Input
            id="discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2 sm:col-span-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-slate-500">
          <span>Discount</span>
          <span>-{formatPKR(discount)}</span>
        </div>
        <div className="mt-2 flex justify-between text-lg font-bold text-teal-800">
          <span>Total</span>
          <span>{formatPKR(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Complete sale"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
