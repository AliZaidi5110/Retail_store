"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { stockMovementSchema } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

export async function adjustStock(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = stockMovementSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid stock data" };
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) return { success: false, message: "Product not found" };

  if (parsed.data.type === "OUT" && product.quantity < parsed.data.quantity) {
    return { success: false, message: "Insufficient stock" };
  }

  const newQty =
    parsed.data.type === "IN"
      ? product.quantity + parsed.data.quantity
      : product.quantity - parsed.data.quantity;

  await prisma.$transaction([
    prisma.product.update({
      where: { id: product.id },
      data: { quantity: newQty },
    }),
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason,
        reference: parsed.data.reference || null,
      },
    }),
  ]);

  revalidatePath("/products");
  revalidatePath(`/products/${product.id}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Stock updated" };
}
