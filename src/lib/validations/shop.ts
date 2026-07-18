import { z } from "zod";

export const shopSchema = z.object({
  shopName: z.string().min(1, "Shop name is required").max(120),
  ownerName: z.string().min(1, "Owner name is required").max(120),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cnic: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  /** Opening credit balance already owed by this shop (PKR) */
  openingBalance: z.coerce.number().min(0).default(0),
});

export type ShopInput = z.infer<typeof shopSchema>;

export const stockIssueItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  ratePerUnit: z.coerce.number().positive(),
});

export const stockIssueSchema = z.object({
  shopId: z.string().min(1, "Select a shop"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional().nullable(),
  items: z.array(stockIssueItemSchema).min(1, "Add at least one product"),
});

export type StockIssueInput = z.infer<typeof stockIssueSchema>;

export const shopPaymentSchema = z.object({
  shopId: z.string().min(1),
  amountPaid: z.coerce.number().positive("Enter a payment amount"),
  datePaid: z.string().min(1),
  paymentMethod: z.enum(["CASH", "CARD", "ONLINE"]),
  stockIssueId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  applyMode: z.enum(["oldest", "manual"]),
});

export type ShopPaymentInput = z.infer<typeof shopPaymentSchema>;

export const stockReturnSchema = z.object({
  stockIssueItemId: z.string().min(1),
  quantityReturned: z.coerce.number().int().positive(),
  dateReturned: z.string().min(1),
});

export type StockReturnInput = z.infer<typeof stockReturnSchema>;
