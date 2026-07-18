"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function getProducts(search?: string, categoryId?: string) {
  await requireAuth();
  return prisma.product.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: {
      category: true,
      supplier: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getProduct(id: string) {
  await requireAuth();
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
      stockMovements: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function createProduct(data: unknown): Promise<ActionResult & { id?: string }> {
  await requireAuth();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid product" };
  }

  const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
  if (existing) return { success: false, message: "SKU already exists" };

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      barcode: parsed.data.barcode || null,
      supplierId: parsed.data.supplierId || null,
      image: parsed.data.image || null,
    },
  });

  if (parsed.data.quantity > 0) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "IN",
        quantity: parsed.data.quantity,
        reason: "Initial stock",
      },
    });
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true, message: "Product created", id: product.id };
}

export async function updateProduct(
  id: string,
  data: unknown
): Promise<ActionResult> {
  await requireAuth();
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid product" };
  }

  const existing = await prisma.product.findFirst({
    where: { sku: parsed.data.sku, NOT: { id } },
  });
  if (existing) return { success: false, message: "SKU already exists" };

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku,
      barcode: parsed.data.barcode || null,
      categoryId: parsed.data.categoryId,
      purchasePrice: parsed.data.purchasePrice,
      sellingPrice: parsed.data.sellingPrice,
      reorderLevel: parsed.data.reorderLevel,
      unit: parsed.data.unit,
      supplierId: parsed.data.supplierId || null,
      image: parsed.data.image || null,
      // quantity managed via stock movements
    },
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Product updated" };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAuth();
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, message: "Product deleted" };
  } catch {
    return {
      success: false,
      message: "Cannot delete product with existing sales history",
    };
  }
}

export async function importProducts(
  rows: Array<Record<string, string | number>>
): Promise<ActionResult & { imported?: number }> {
  await requireAuth();
  let imported = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    try {
      const categoryName = String(row.category || row.Category || "").trim();
      if (!categoryName) {
        errors.push(`Row ${index + 1}: missing category`);
        continue;
      }

      let category = await prisma.category.findUnique({ where: { name: categoryName } });
      if (!category) {
        category = await prisma.category.create({ data: { name: categoryName } });
      }

      let supplierId: string | null = null;
      const supplierName = String(row.supplier || row.Supplier || "").trim();
      if (supplierName) {
        let supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
        if (!supplier) {
          supplier = await prisma.supplier.create({ data: { name: supplierName } });
        }
        supplierId = supplier.id;
      }

      const sku = String(row.sku || row.SKU || "").trim();
      const name = String(row.name || row.Name || "").trim();
      if (!sku || !name) {
        errors.push(`Row ${index + 1}: missing name or SKU`);
        continue;
      }

      const purchasePrice = Number(row.purchasePrice ?? row.purchase_price ?? 0);
      const sellingPrice = Number(row.sellingPrice ?? row.selling_price ?? 0);
      const quantity = Number(row.quantity ?? 0);
      const reorderLevel = Number(row.reorderLevel ?? row.reorder_level ?? 5);
      const unitRaw = String(row.unit || "PCS").toUpperCase();
      const unit = ["PCS", "KG", "BOX"].includes(unitRaw) ? (unitRaw as "PCS" | "KG" | "BOX") : "PCS";

      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        await prisma.product.update({
          where: { sku },
          data: {
            name,
            categoryId: category.id,
            purchasePrice,
            sellingPrice,
            reorderLevel,
            unit,
            supplierId,
            barcode: row.barcode ? String(row.barcode) : existing.barcode,
          },
        });
      } else {
        const product = await prisma.product.create({
          data: {
            name,
            sku,
            barcode: row.barcode ? String(row.barcode) : null,
            categoryId: category.id,
            purchasePrice,
            sellingPrice,
            quantity: Math.max(0, Math.floor(quantity)),
            reorderLevel: Math.max(0, Math.floor(reorderLevel)),
            unit,
            supplierId,
          },
        });
        if (quantity > 0) {
          await prisma.stockMovement.create({
            data: {
              productId: product.id,
              type: "IN",
              quantity: Math.floor(quantity),
              reason: "Bulk import",
            },
          });
        }
      }
      imported += 1;
    } catch (e) {
      errors.push(`Row ${index + 1}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  revalidatePath("/products");
  revalidatePath("/dashboard");
  return {
    success: imported > 0,
    imported,
    message:
      errors.length > 0
        ? `Imported ${imported}. Issues: ${errors.slice(0, 3).join("; ")}`
        : `Imported ${imported} products`,
  };
}
