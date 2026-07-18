"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations/settings";
import type { ActionResult } from "@/lib/actions/auth";
import { auth } from "@/lib/auth";

export async function getSettings() {
  await auth();
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        storeName: "My Store",
        currency: "PKR",
        taxRate: 0,
        gstEnabled: false,
      },
    });
  }
  return settings;
}

export async function updateSettings(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid settings" };
  }

  const existing = await prisma.storeSettings.findFirst();
  if (existing) {
    await prisma.storeSettings.update({
      where: { id: existing.id },
      data: {
        storeName: parsed.data.storeName,
        logo: parsed.data.logo || null,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        currency: parsed.data.currency || "PKR",
        taxRate: parsed.data.taxRate,
        gstEnabled: parsed.data.gstEnabled,
      },
    });
  } else {
    await prisma.storeSettings.create({
      data: {
        storeName: parsed.data.storeName,
        logo: parsed.data.logo || null,
        address: parsed.data.address || null,
        phone: parsed.data.phone || null,
        currency: parsed.data.currency || "PKR",
        taxRate: parsed.data.taxRate,
        gstEnabled: parsed.data.gstEnabled,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Settings saved" };
}
