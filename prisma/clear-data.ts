import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = {
    saleItems: (await prisma.saleItem.deleteMany()).count,
    sales: (await prisma.sale.deleteMany()).count,
    stockMovements: (await prisma.stockMovement.deleteMany()).count,
    expenses: (await prisma.expense.deleteMany()).count,
    products: (await prisma.product.deleteMany()).count,
    supplierPayments: (await prisma.supplierPayment.deleteMany()).count,
    suppliers: (await prisma.supplier.deleteMany()).count,
    stockReturns: (await prisma.stockReturn.deleteMany()).count,
    shopPayments: (await prisma.shopPayment.deleteMany()).count,
    stockIssueItems: (await prisma.stockIssueItem.deleteMany()).count,
    stockIssues: (await prisma.stockIssue.deleteMany()).count,
    shops: (await prisma.shop.deleteMany()).count,
    categories: (await prisma.category.deleteMany()).count,
  };

  await prisma.storeSettings.deleteMany();
  await prisma.storeSettings.create({
    data: {
      storeName: "My Store",
      currency: "PKR",
      taxRate: 0,
      gstEnabled: false,
    },
  });

  console.log("Cleared test data:", deleted);
  console.log("Owner login kept. Update store details in Settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
