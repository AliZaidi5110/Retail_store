"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { expenseSchema, type ExpenseInput } from "@/lib/validations/expense";
import { createExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "RENT",
  "UTILITIES",
  "SALARIES",
  "TRANSPORT",
  "PURCHASE_OF_GOODS",
  "MISC",
] as const;

export function ExpenseForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "MISC",
      amount: 0,
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      isRecurring: false,
      recurringInterval: "monthly",
    },
  });

  const isRecurring = form.watch("isRecurring");

  async function onSubmit(values: ExpenseInput) {
    setPending(true);
    try {
      const result = await createExpense(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push("/expenses");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(v) =>
              form.setValue("category", v as ExpenseInput["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min={0}
            {...form.register("amount")}
            autoFocus
          />
          {form.formState.errors.amount && (
            <p className="text-xs text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" {...form.register("date")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...form.register("description")} />
        </div>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="recurring"
            checked={isRecurring}
            onCheckedChange={(v) => form.setValue("isRecurring", Boolean(v))}
          />
          <Label htmlFor="recurring" className="cursor-pointer">
            Recurring expense
          </Label>
        </div>
        {isRecurring && (
          <div className="space-y-2">
            <Label>Interval</Label>
            <Select
              value={form.watch("recurringInterval") || "monthly"}
              onValueChange={(v) => form.setValue("recurringInterval", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save expense"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
