"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategory, deleteCategory } from "@/lib/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  _count: { products: number };
};

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await createCategory({ name, description: description || null });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setName("");
      setDescription("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(id: string) {
    const result = await deleteCategory(id);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding..." : "Add category"}
          </Button>
        </div>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Products</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-slate-500">{c.description || "—"}</TableCell>
              <TableCell>{c._count.products}</TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => onDelete(c.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
