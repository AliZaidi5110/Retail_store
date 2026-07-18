"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setShopUnpaidAmount } from "@/lib/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";

export function SetUnpaidForm({
  shopId,
  currentUnpaid,
}: {
  shopId: string;
  currentUnpaid: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(currentUnpaid));
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await setShopUnpaidAmount(shopId, Number(amount));
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-slate-600">
        Current unpaid:{" "}
        <span className="font-semibold text-amber-700">{formatPKR(currentUnpaid)}</span>
      </p>
      <div className="space-y-2">
        <Label htmlFor="unpaidAmount">Amount left / unpaid (PKR)</Label>
        <Input
          id="unpaidAmount"
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <p className="text-xs text-slate-500">
          Enter the full amount this shop still owes. Use Record Payment when they actually pay.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Update unpaid amount"}
      </Button>
    </form>
  );
}
