"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

export async function getCategories() {
  await auth();
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid category" };
  }

  try {
    await prisma.category.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
    revalidatePath("/products/categories");
    revalidatePath("/products");
    return { success: true, message: "Category created" };
  } catch {
    return { success: false, message: "Category name already exists" };
  }
}

export async function updateCategory(id: string, data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid category" };
  }

  try {
    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
    revalidatePath("/products/categories");
    return { success: true, message: "Category updated" };
  } catch {
    return { success: false, message: "Could not update category" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return { success: false, message: "Remove or reassign products first" };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/products/categories");
  return { success: true, message: "Category deleted" };
}
