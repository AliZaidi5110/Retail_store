"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { recordShopPayment } from "@/lib/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency";

type OpenIssue = {
  id: string;
  dateLabel: string;
  amountRemaining: number;
};

export function ShopPaymentForm({
  shopId,
  outstanding,
  openIssues,
}: {
  shopId: string;
  outstanding: number;
  openIssues: OpenIssue[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [datePaid, setDatePaid] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "ONLINE">("CASH");
  const [applyMode, setApplyMode] = useState<"oldest" | "manual">("oldest");
  const [stockIssueId, setStockIssueId] = useState("");
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (outstanding <= 0) {
      toast.error("No outstanding balance");
      return;
    }
    setPending(true);
    try {
      const result = await recordShopPayment({
        shopId,
        amountPaid: Number(amountPaid),
        datePaid,
        paymentMethod,
        applyMode,
        stockIssueId: applyMode === "manual" ? stockIssueId : null,
        notes: notes || null,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setAmountPaid("");
      setNotes("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (outstanding <= 0) {
    return (
      <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-teal-800">
        This shop has no outstanding balance.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Outstanding: <span className="font-semibold text-amber-700">{formatPKR(outstanding)}</span>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amountPaid">Amount paid (PKR)</Label>
          <Input
            id="amountPaid"
            type="number"
            min={0.01}
            step="0.01"
            max={outstanding}
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="datePaid">Date paid</Label>
          <Input
            id="datePaid"
            type="date"
            value={datePaid}
            onChange={(e) => setDatePaid(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment method</Label>
          <select
            id="paymentMethod"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "CARD" | "ONLINE")}
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="applyMode">Apply payment</Label>
          <select
            id="applyMode"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={applyMode}
            onChange={(e) => setApplyMode(e.target.value as "oldest" | "manual")}
          >
            <option value="oldest">Oldest unpaid first (running khata)</option>
            <option value="manual">Against a specific issue</option>
          </select>
        </div>
      </div>

      {applyMode === "manual" && (
        <div className="space-y-2">
          <Label htmlFor="stockIssueId">Transaction</Label>
          <select
            id="stockIssueId"
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={stockIssueId}
            onChange={(e) => setStockIssueId(e.target.value)}
            required
          >
            <option value="">Select issue</option>
            {openIssues.map((i) => (
              <option key={i.id} value={i.id}>
                {i.dateLabel} — remaining {formatPKR(i.amountRemaining)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Note (optional)</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Record payment"}
      </Button>
    </form>
  );
}
