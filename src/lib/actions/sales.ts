"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saleSchema } from "@/lib/validations/sale";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function getSales(
  limit = 50,
  filters?: {
    from?: string;
    to?: string;
    paymentMethod?: string;
    productId?: string;
  }
) {
  await auth();

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters?.from) createdAt.gte = new Date(`${filters.from}T00:00:00`);
  if (filters?.to) createdAt.lte = new Date(`${filters.to}T23:59:59`);

  const paymentMethod =
    filters?.paymentMethod && ["CASH", "CARD", "ONLINE"].includes(filters.paymentMethod)
      ? (filters.paymentMethod as "CASH" | "CARD" | "ONLINE")
      : undefined;

  return prisma.sale.findMany({
    where: {
      ...(Object.keys(createdAt).length ? { createdAt } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
      ...(filters?.productId
        ? { items: { some: { productId: filters.productId } } }
        : {}),
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSale(id: string) {
  await auth();
  return prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
    },
  });
}

export async function createSale(data: unknown): Promise<ActionResult & { id?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = saleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid sale" };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of parsed.data.items) {
    const product = productMap.get(item.productId);
    if (!product) return { success: false, message: "Product not found" };
    if (product.quantity < item.quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${product.name} (available: ${product.quantity})`,
      };
    }
  }

  const lineItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const lineTotal = item.unitPrice * item.quantity - (item.discount || 0);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasePrice: Number(product.purchasePrice),
      discount: item.discount || 0,
      total: lineTotal,
    };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const discount = parsed.data.discount || 0;
  if (discount > subtotal) {
    return { success: false, message: "Discount cannot exceed subtotal" };
  }
  const total = subtotal - discount;

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        discount,
        subtotal,
        total,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes || null,
        items: { create: lineItems },
      },
    });

    for (const item of parsed.data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          quantity: item.quantity,
          reason: "Sale",
          reference: created.invoiceNumber,
        },
      });
    }

    return created;
  });

  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/profit-loss");
  return { success: true, message: "Sale recorded", id: sale.id };
}
