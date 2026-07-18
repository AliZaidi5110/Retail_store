import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Wipe all business data — owner can add their own records
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeSettings.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash("Store@123", 12);

  await prisma.user.create({
    data: {
      name: "Store Owner",
      email: "owner@store.pk",
      password,
    },
  });

  await prisma.storeSettings.create({
    data: {
      storeName: "My Store",
      currency: "PKR",
      taxRate: 0,
      gstEnabled: false,
    },
  });

  console.log("Fresh database ready (no sample products/sales/expenses).");
  console.log("Login: owner@store.pk / Store@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
