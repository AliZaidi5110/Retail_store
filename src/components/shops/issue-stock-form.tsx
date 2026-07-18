"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { issueStock } from "@/lib/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";

type ProductOption = {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
};

type Line = {
  key: string;
  productId: string;
  quantity: string;
  ratePerUnit: string;
};

export function IssueStockForm({
  shopId,
  products,
}: {
  shopId: string;
  products: ProductOption[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { key: crypto.randomUUID(), productId: "", quantity: "1", ratePerUnit: "" },
  ]);

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const q = Number(line.quantity) || 0;
      const r = Number(line.ratePerUnit) || 0;
      return sum + q * r;
    }, 0);
  }, [lines]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: crypto.randomUUID(), productId: "", quantity: "1", ratePerUnit: "" },
    ]);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (patch.productId) {
          const product = products.find((p) => p.id === patch.productId);
          if (product && !line.ratePerUnit) {
            next.ratePerUnit = String(product.sellingPrice);
          }
        }
        return next;
      })
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await issueStock({
        shopId,
        date,
        notes: notes || null,
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          ratePerUnit: Number(l.ratePerUnit),
        })),
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/shops/${shopId}`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date issued</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Products given</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add line
          </Button>
        </div>

        {lines.map((line) => {
          const product = products.find((p) => p.id === line.productId);
          return (
            <div
              key={line.key}
              className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={line.productId}
                  onChange={(e) => updateLine(line.key, { productId: e.target.value })}
                  required
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (stock {p.quantity} {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input
                  type="number"
                  min={1}
                  max={product?.quantity}
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="Rate (PKR)"
                  value={line.ratePerUnit}
                  onChange={(e) => updateLine(line.key, { ratePerUnit: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  {formatPKR((Number(line.quantity) || 0) * (Number(line.ratePerUnit) || 0))}
                </span>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-600">Transaction total</span>
        <span className="text-lg font-bold text-teal-800">{formatPKR(total)}</span>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Issuing..." : "Issue stock"}
      </Button>
    </form>
  );
}
