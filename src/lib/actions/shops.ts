"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions/auth";
import {
  shopPaymentSchema,
  shopSchema,
  stockIssueSchema,
  stockReturnSchema,
} from "@/lib/validations/shop";
import { decimalToNumber } from "@/lib/utils";
import { issueStatus, roundMoney } from "@/lib/shops/status";

async function recalculateIssue(tx: Prisma.TransactionClient, issueId: string) {
  const issue = await tx.stockIssue.findUnique({
    where: { id: issueId },
    include: {
      items: true,
      payments: true,
    },
  });
  if (!issue) return;

  const totalAmount = roundMoney(
    issue.items.reduce((s, i) => s + decimalToNumber(i.lineTotal), 0)
  );
  const amountPaid = roundMoney(
    issue.payments.reduce((s, p) => s + decimalToNumber(p.amountPaid), 0)
  );
  const amountRemaining = roundMoney(Math.max(0, totalAmount - amountPaid));
  const status = issueStatus(amountPaid, totalAmount);

  await tx.stockIssue.update({
    where: { id: issueId },
    data: { totalAmount, amountPaid, amountRemaining, status },
  });
}

export async function getShops(search?: string) {
  await auth();
  const shops = await prisma.shop.findMany({
    where: search
      ? {
          OR: [
            { shopName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { ownerName: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      stockIssues: {
        select: {
          id: true,
          date: true,
          amountRemaining: true,
          amountPaid: true,
          totalAmount: true,
          status: true,
        },
        orderBy: { date: "desc" },
      },
      payments: {
        select: { datePaid: true },
        orderBy: { datePaid: "desc" },
        take: 1,
      },
    },
    orderBy: { shopName: "asc" },
  });

  const mapped = shops.map((shop) => {
    const outstanding = roundMoney(
      shop.stockIssues.reduce((s, i) => s + decimalToNumber(i.amountRemaining), 0)
    );
    const totalGiven = roundMoney(
      shop.stockIssues.reduce((s, i) => s + decimalToNumber(i.totalAmount), 0)
    );
    const totalPaid = roundMoney(
      shop.stockIssues.reduce((s, i) => s + decimalToNumber(i.amountPaid), 0)
    );
    const lastIssue = shop.stockIssues[0]?.date ?? null;
    const hasPartial = shop.stockIssues.some((i) => i.status === "PARTIAL");
    const hasUnpaid = shop.stockIssues.some((i) => i.status === "UNPAID");

    let badge: "PAID" | "PARTIAL" | "UNPAID" | "OVERDUE" = "PAID";
    if (outstanding > 0) {
      const oldestOpen = shop.stockIssues
        .filter((i) => decimalToNumber(i.amountRemaining) > 0)
        .map((i) => i.date)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      if (oldestOpen && Date.now() - oldestOpen.getTime() > 30 * 24 * 60 * 60 * 1000) {
        badge = "OVERDUE";
      } else if (hasPartial || (totalPaid > 0 && outstanding > 0)) {
        badge = "PARTIAL";
      } else if (hasUnpaid) {
        badge = "UNPAID";
      } else {
        badge = "PARTIAL";
      }
    }

    return {
      ...shop,
      outstanding,
      totalGiven,
      totalPaid,
      lastIssueDate: lastIssue,
      lastPaymentDate: shop.payments[0]?.datePaid ?? null,
      badge,
    };
  });

  mapped.sort((a, b) => b.outstanding - a.outstanding);
  return mapped;
}

export async function getShop(id: string) {
  await auth();
  return prisma.shop.findUnique({
    where: { id },
    include: {
      stockIssues: {
        include: {
          items: {
            include: {
              product: true,
              returns: { orderBy: { dateReturned: "desc" } },
            },
          },
          payments: { orderBy: { datePaid: "desc" } },
        },
        orderBy: { date: "desc" },
      },
      payments: {
        orderBy: { datePaid: "desc" },
        take: 30,
        include: { stockIssue: { select: { id: true, date: true } } },
      },
    },
  });
}

export async function createShop(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = shopSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid shop" };
  }

  const openingBalance = roundMoney(parsed.data.openingBalance || 0);

  const shop = await prisma.shop.create({
    data: {
      shopName: parsed.data.shopName,
      ownerName: parsed.data.ownerName,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      cnic: parsed.data.cnic || null,
      notes: parsed.data.notes || null,
    },
  });

  if (openingBalance > 0) {
    await prisma.stockIssue.create({
      data: {
        shopId: shop.id,
        date: new Date(),
        totalAmount: openingBalance,
        amountPaid: 0,
        amountRemaining: openingBalance,
        status: "UNPAID",
        notes: "Opening balance / previous credit",
      },
    });
  }

  revalidatePath("/shops");
  revalidatePath("/dashboard");
  return {
    success: true,
    message:
      openingBalance > 0
        ? "Shop added with opening amount owed"
        : "Shop added",
  };
}

export async function updateShop(id: string, data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = shopSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid shop" };
  }

  await prisma.shop.update({
    where: { id },
    data: {
      shopName: parsed.data.shopName,
      ownerName: parsed.data.ownerName,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      cnic: parsed.data.cnic || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/shops");
  revalidatePath(`/shops/${id}`);
  return { success: true, message: "Shop updated" };
}

export async function issueStock(data: unknown): Promise<ActionResult & { id?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = stockIssueSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid issue" };
  }

  const shop = await prisma.shop.findUnique({ where: { id: parsed.data.shopId } });
  if (!shop) return { success: false, message: "Shop not found" };

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
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
    const lineTotal = roundMoney(item.quantity * item.ratePerUnit);
    return {
      productId: item.productId,
      quantity: item.quantity,
      quantityReturned: 0,
      ratePerUnit: item.ratePerUnit,
      lineTotal,
    };
  });
  const totalAmount = roundMoney(lineItems.reduce((s, i) => s + i.lineTotal, 0));

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.stockIssue.create({
      data: {
        shopId: parsed.data.shopId,
        date: new Date(`${parsed.data.date}T12:00:00`),
        totalAmount,
        amountPaid: 0,
        amountRemaining: totalAmount,
        status: "UNPAID",
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
          reason: `Issued to shop: ${shop.shopName}`,
          reference: created.id,
        },
      });
    }

    return created;
  });

  revalidatePath("/shops");
  revalidatePath(`/shops/${parsed.data.shopId}`);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true, message: "Stock issued and inventory updated", id: issue.id };
}

export async function recordShopPayment(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = shopPaymentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid payment" };
  }

  let remainingToApply = roundMoney(parsed.data.amountPaid);
  if (remainingToApply <= 0) {
    return { success: false, message: "Enter a valid payment amount" };
  }

  const openIssues = await prisma.stockIssue.findMany({
    where: {
      shopId: parsed.data.shopId,
      amountRemaining: { gt: 0 },
      ...(parsed.data.applyMode === "manual" && parsed.data.stockIssueId
        ? { id: parsed.data.stockIssueId }
        : {}),
    },
    orderBy: { date: "asc" },
  });

  if (openIssues.length === 0) {
    return { success: false, message: "No outstanding balance for this shop" };
  }

  if (parsed.data.applyMode === "manual") {
    if (!parsed.data.stockIssueId) {
      return { success: false, message: "Select a transaction for this payment" };
    }
    const issue = openIssues[0];
    const owed = decimalToNumber(issue.amountRemaining);
    if (remainingToApply > owed + 0.001) {
      return {
        success: false,
        message: `Payment exceeds remaining on that issue (${owed.toFixed(2)})`,
      };
    }
  } else {
    const totalOwed = roundMoney(
      openIssues.reduce((s, i) => s + decimalToNumber(i.amountRemaining), 0)
    );
    if (remainingToApply > totalOwed + 0.001) {
      return {
        success: false,
        message: `Payment exceeds total outstanding (${totalOwed.toFixed(2)})`,
      };
    }
  }

  const datePaid = new Date(`${parsed.data.datePaid}T12:00:00`);

  await prisma.$transaction(async (tx) => {
    for (const issue of openIssues) {
      if (remainingToApply <= 0) break;
      const owed = decimalToNumber(issue.amountRemaining);
      const apply = roundMoney(Math.min(owed, remainingToApply));
      if (apply <= 0) continue;

      await tx.shopPayment.create({
        data: {
          shopId: parsed.data.shopId,
          stockIssueId: issue.id,
          amountPaid: apply,
          datePaid,
          paymentMethod: parsed.data.paymentMethod,
          notes: parsed.data.notes || null,
        },
      });

      remainingToApply = roundMoney(remainingToApply - apply);
      await recalculateIssue(tx, issue.id);
    }
  });

  revalidatePath("/shops");
  revalidatePath(`/shops/${parsed.data.shopId}`);
  revalidatePath("/dashboard");
  return { success: true, message: "Payment recorded (counts as revenue when paid)" };
}

export async function recordStockReturn(data: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const parsed = stockReturnSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0]?.message ?? "Invalid return" };
  }

  const item = await prisma.stockIssueItem.findUnique({
    where: { id: parsed.data.stockIssueItemId },
    include: {
      stockIssue: true,
      product: true,
    },
  });
  if (!item) return { success: false, message: "Issue line not found" };

  const outstandingQty = item.quantity - item.quantityReturned;
  if (parsed.data.quantityReturned > outstandingQty) {
    return {
      success: false,
      message: `Can only return up to ${outstandingQty} units`,
    };
  }

  const rate = decimalToNumber(item.ratePerUnit);
  const reduction = roundMoney(parsed.data.quantityReturned * rate);
  const newQtyReturned = item.quantityReturned + parsed.data.quantityReturned;
  const newLineTotal = roundMoney((item.quantity - newQtyReturned) * rate);

  await prisma.$transaction(async (tx) => {
    await tx.stockReturn.create({
      data: {
        stockIssueItemId: item.id,
        quantityReturned: parsed.data.quantityReturned,
        dateReturned: new Date(`${parsed.data.dateReturned}T12:00:00`),
      },
    });

    await tx.stockIssueItem.update({
      where: { id: item.id },
      data: {
        quantityReturned: newQtyReturned,
        lineTotal: newLineTotal,
      },
    });

    await tx.product.update({
      where: { id: item.productId },
      data: { quantity: { increment: parsed.data.quantityReturned } },
    });

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "IN",
        quantity: parsed.data.quantityReturned,
        reason: `Return from shop credit issue`,
        reference: item.stockIssueId,
      },
    });

    // If payments already exceed new total, clamp by leaving remaining at 0
    await recalculateIssue(tx, item.stockIssueId);

    const refreshed = await tx.stockIssue.findUnique({ where: { id: item.stockIssueId } });
    if (refreshed) {
      const paid = decimalToNumber(refreshed.amountPaid);
      const total = decimalToNumber(refreshed.totalAmount);
      if (paid > total) {
        // Keep amountPaid as historical sum of payments; remaining is 0
        await tx.stockIssue.update({
          where: { id: refreshed.id },
          data: {
            amountRemaining: 0,
            status: "PAID",
          },
        });
      }
    }

    // silence unused
    void reduction;
  });

  revalidatePath("/shops");
  revalidatePath(`/shops/${item.stockIssue.shopId}`);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  return { success: true, message: "Return recorded — stock restored to inventory" };
}

export async function getShopsOutstandingTotal() {
  await auth();
  const result = await prisma.stockIssue.aggregate({
    _sum: { amountRemaining: true },
  });
  return decimalToNumber(result._sum.amountRemaining);
}
