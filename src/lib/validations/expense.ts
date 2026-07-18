import { z } from "zod";

export const expenseSchema = z.object({
  category: z.enum([
    "RENT",
    "UTILITIES",
    "SALARIES",
    "TRANSPORT",
    "PURCHASE_OF_GOODS",
    "MISC",
  ]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  receiptUrl: z.string().optional().nullable(),
  isRecurring: z.boolean(),
  recurringInterval: z.string().optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
