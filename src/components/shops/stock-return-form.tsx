"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { recordStockReturn } from "@/lib/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReturnableItem = {
  id: string;
  label: string;
  maxQty: number;
};

export function StockReturnForm({ items }: { items: ReturnableItem[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [stockIssueItemId, setStockIssueItemId] = useState("");
  const [quantityReturned, setQuantityReturned] = useState("1");
  const [dateReturned, setDateReturned] = useState(format(new Date(), "yyyy-MM-dd"));

  const selected = items.find((i) => i.id === stockIssueItemId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await recordStockReturn({
        stockIssueItemId,
        quantityReturned: Number(quantityReturned),
        dateReturned,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setStockIssueItemId("");
      setQuantityReturned("1");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No issued stock available to return.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="item">Product / issue line</Label>
        <select
          id="item"
          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
          value={stockIssueItemId}
          onChange={(e) => setStockIssueItemId(e.target.value)}
          required
        >
          <option value="">Select line</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label} (max {i.maxQty})
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="qty">Qty returned</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            max={selected?.maxQty ?? undefined}
            value={quantityReturned}
            onChange={(e) => setQuantityReturned(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateReturned">Date</Label>
          <Input
            id="dateReturned"
            type="date"
            value={dateReturned}
            onChange={(e) => setDateReturned(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving..." : "Record return"}
      </Button>
    </form>
  );
}
