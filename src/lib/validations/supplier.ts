import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  contact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  amountOwed: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
