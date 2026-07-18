"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";

export function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();

  async function onDelete() {
    const result = await deleteExpense(id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
      Delete
    </Button>
  );
}
