import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "Add at least one product"),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE"]),
  notes: z.string().optional().nullable(),
});

export type SaleInput = z.infer<typeof saleSchema>;
