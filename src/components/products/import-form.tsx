"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { importProducts } from "@/lib/actions/products";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ImportForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<number>(0);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPending(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet);
      setPreview(rows.length);

      if (rows.length === 0) {
        toast.error("No rows found in file");
        return;
      }

      const result = await importProducts(rows);
      if (!result.success) {
        toast.error(result.message || "Import failed");
        return;
      }
      toast.success(result.message);
      router.push("/products");
      router.refresh();
    } catch {
      toast.error("Could not parse file");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
        <Label htmlFor="file" className="mb-2 block">
          Upload CSV or Excel (.xlsx)
        </Label>
        <input
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={onFile}
          disabled={pending}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-700"
        />
        {pending && <p className="mt-3 text-sm text-slate-500">Importing...</p>}
        {preview > 0 && !pending && (
          <p className="mt-3 text-sm text-slate-500">Parsed {preview} rows</p>
        )}
      </div>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Expected columns</p>
        <p className="mt-1 font-mono text-xs">
          name, sku, category, purchasePrice, sellingPrice, quantity, reorderLevel, unit,
          supplier, barcode
        </p>
      </div>
      <Button type="button" variant="outline" onClick={() => router.push("/products")}>
        Back to products
      </Button>
    </div>
  );
}
