import { z } from "zod";

export const settingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required").max(120),
  logo: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  currency: z.string().min(1),
  taxRate: z.coerce.number().min(0).max(100),
  gstEnabled: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
