"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supplierSchema } from "@/lib/validations/supplier";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

export async function getSuppliers() {
  await auth();
  return prisma.supplier.findMany({
    include: {
      _count: { select: { products: true } },
      products: {
        select: {
          id: true,
          name: true,
          sku: true,
          purchasePrice: true,
          quantity: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplier(id: string) {
  await auth();
  return prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: { category: true },
        orderBy: { name: "asc" },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
}

export async function recordSupplierPayment(
  supplierId: string,
  data: { mode: "full" | "manual"; amount?: number; note?: string }
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return { success: false, message: "Supplier not found" };

  const owed = Number(supplier.amountOwed);
  if (owed <= 0) {
    return { success: false, message: "No outstanding amount for this supplier" };
  }

  let paymentAmount = 0;
  if (data.mode === "full") {
    paymentAmount = owed;
  } else {
    paymentAmount = Number(data.amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return { success: false, message: "Enter a valid payment amount" };
    }
    if (paymentAmount > owed) {
      return {
        success: false,
        message: `Payment cannot exceed amount owed (${owed.toFixed(2)})`,
      };
    }
  }

  const remaining = Math.max(0, Math.round((owed - paymentAmount) * 100) / 100);

  await prisma.$transaction([
    prisma.supplierPayment.create({
      data: {
        supplierId,
        amount: paymentAmount,
        note:
          data.note?.trim() ||
          (data.mode === "full" ? "Paid in full" : "Partial payment"),
      },
    }),
    prisma.supplier.update({
      where: { id: supplierId },
      data: { amountOwed: remaining },
    }),
  ]);

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  return {
    success: true,
    message:
      remaining === 0
        ? "Full payment recorded — balance is cleared"
        : `Payment recorded. Remaining balance updated.`,
  };
}

export async function createSupplier(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = supplierSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid supplier" };
  }

  await prisma.supplier.create({
    data: {
      name: parsed.data.name,
      contact: parsed.data.contact || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      amountOwed: parsed.data.amountOwed || 0,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/suppliers");
  return { success: true, message: "Supplier created" };
}

export async function updateSupplier(id: string, data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = supplierSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid supplier" };
  }

  await prisma.supplier.update({
    where: { id },
    data: {
      name: parsed.data.name,
      contact: parsed.data.contact || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      amountOwed: parsed.data.amountOwed || 0,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${id}`);
  return { success: true, message: "Supplier updated" };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  await prisma.product.updateMany({
    where: { supplierId: id },
    data: { supplierId: null },
  });
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  return { success: true, message: "Supplier deleted" };
}
