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
    },
  });
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
