"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adjustStock } from "@/lib/actions/stock";
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

export function StockForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await adjustStock({
        productId,
        type,
        quantity,
        reason,
        reference: reference || null,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setReason("");
      setReference("");
      setQuantity(1);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as "IN" | "OUT")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">Stock IN</SelectItem>
            <SelectItem value="OUT">Stock OUT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qty">Quantity</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Purchase, damage, adjustment..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ref">Reference</Label>
        <Input
          id="ref"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="PO number (optional)"
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Updating..." : "Adjust stock"}
        </Button>
      </div>
    </form>
  );
}
