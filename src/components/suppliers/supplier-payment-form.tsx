"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { recordSupplierPayment } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";

export function SupplierPaymentForm({
  supplierId,
  amountOwed,
}: {
  supplierId: string;
  amountOwed: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function pay(mode: "full" | "manual") {
    if (amountOwed <= 0) {
      toast.error("No outstanding amount");
      return;
    }

    setPending(true);
    try {
      const result = await recordSupplierPayment(supplierId, {
        mode,
        amount: mode === "manual" ? Number(amount) : undefined,
        note: note.trim() || undefined,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setAmount("");
      setNote("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (amountOwed <= 0) {
    return (
      <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
        No amount owed — this supplier is fully paid.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Outstanding balance:{" "}
        <span className="font-semibold text-amber-700">{formatPKR(amountOwed)}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => pay("full")}
          className="bg-teal-700 hover:bg-teal-800"
        >
          {pending ? "Saving..." : "Pay full amount"}
        </Button>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 text-sm font-medium text-slate-700">Or pay a custom amount</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Amount paid (PKR)</Label>
            <Input
              id="paymentAmount"
              type="number"
              min={0.01}
              step="0.01"
              max={amountOwed}
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentNote">Note (optional)</Label>
            <Input
              id="paymentNote"
              placeholder="Cash / bank transfer"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={pending || !amount}
          onClick={() => pay("manual")}
        >
          Record payment
        </Button>
      </div>
    </div>
  );
}
