import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  purchasePrice: z.coerce.number().min(0, "Must be 0 or more"),
  sellingPrice: z.coerce.number().min(0, "Must be 0 or more"),
  quantity: z.coerce.number().int().min(0, "Must be 0 or more"),
  reorderLevel: z.coerce.number().int().min(0, "Must be 0 or more"),
  unit: z.enum(["PCS", "KG", "BOX"]),
  supplierId: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const stockMovementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "OUT"]),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  reason: z.string().min(1, "Reason is required").max(200),
  reference: z.string().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().optional().nullable(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
