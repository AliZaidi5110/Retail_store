import { PrismaClient, PaymentMethod, ExpenseCategory, Unit, StockMovementType } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, addHours } from "date-fns";

const prisma = new PrismaClient();

async function main() {
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
      storeName: "Al-Madina General Store",
      address: "Shop 12, Block B, Gulshan-e-Iqbal, Karachi",
      phone: "+92 300 1234567",
      currency: "PKR",
      taxRate: 0,
      gstEnabled: false,
    },
  });

  const categories = await Promise.all(
    [
      { name: "Groceries", description: "Daily grocery essentials" },
      { name: "Beverages", description: "Drinks and juices" },
      { name: "Snacks", description: "Chips, biscuits and snacks" },
      { name: "Household", description: "Cleaning and home items" },
      { name: "Personal Care", description: "Hygiene and personal care" },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const [groceries, beverages, snacks, household, personalCare] = categories;

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "National Foods Distributors",
        contact: "Ahmed Khan",
        email: "ahmed@nfd.pk",
        phone: "+92 321 1112233",
        address: "SITE Area, Karachi",
        amountOwed: 45000,
        notes: "Monthly credit account",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Engro Foods Supply",
        contact: "Sara Ali",
        email: "sara@engrosupply.pk",
        phone: "+92 333 4455667",
        address: "Port Qasim, Karachi",
        amountOwed: 18500,
        notes: "Dairy and beverages",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Unilever Pakistan Wholesale",
        contact: "Bilal Hussain",
        email: "bilal@upw.pk",
        phone: "+92 301 9988776",
        address: "Korangi Industrial Area",
        amountOwed: 0,
        notes: "Cash on delivery preferred",
      },
    }),
  ]);

  const [nfd, engro, unilever] = suppliers;

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Tapal Danedar Tea 900g",
        sku: "GRC-TEA-001",
        barcode: "8901234567001",
        categoryId: groceries.id,
        purchasePrice: 850,
        sellingPrice: 1050,
        quantity: 45,
        reorderLevel: 10,
        unit: Unit.PCS,
        supplierId: nfd.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Dalda Cooking Oil 5L",
        sku: "GRC-OIL-002",
        barcode: "8901234567002",
        categoryId: groceries.id,
        purchasePrice: 2200,
        sellingPrice: 2650,
        quantity: 28,
        reorderLevel: 8,
        unit: Unit.PCS,
        supplierId: nfd.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Shan Biryani Masala 100g",
        sku: "GRC-MSP-003",
        barcode: "8901234567003",
        categoryId: groceries.id,
        purchasePrice: 95,
        sellingPrice: 130,
        quantity: 80,
        reorderLevel: 20,
        unit: Unit.PCS,
        supplierId: nfd.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Nestle Milk Pack 1L",
        sku: "BEV-MLK-004",
        barcode: "8901234567004",
        categoryId: beverages.id,
        purchasePrice: 280,
        sellingPrice: 340,
        quantity: 60,
        reorderLevel: 15,
        unit: Unit.PCS,
        supplierId: engro.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Coca-Cola 1.5L",
        sku: "BEV-COK-005",
        barcode: "8901234567005",
        categoryId: beverages.id,
        purchasePrice: 140,
        sellingPrice: 180,
        quantity: 72,
        reorderLevel: 24,
        unit: Unit.PCS,
        supplierId: engro.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Nestle Pure Life Water 1.5L",
        sku: "BEV-WTR-006",
        barcode: "8901234567006",
        categoryId: beverages.id,
        purchasePrice: 55,
        sellingPrice: 80,
        quantity: 120,
        reorderLevel: 30,
        unit: Unit.PCS,
        supplierId: engro.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lays Classic Chips 50g",
        sku: "SNK-LAY-007",
        barcode: "8901234567007",
        categoryId: snacks.id,
        purchasePrice: 45,
        sellingPrice: 70,
        quantity: 95,
        reorderLevel: 25,
        unit: Unit.PCS,
        supplierId: unilever.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Peek Freans Sooper Biscuits",
        sku: "SNK-BIS-008",
        barcode: "8901234567008",
        categoryId: snacks.id,
        purchasePrice: 90,
        sellingPrice: 120,
        quantity: 8,
        reorderLevel: 15,
        unit: Unit.PCS,
        supplierId: nfd.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Surf Excel Detergent 1kg",
        sku: "HSH-SRF-009",
        barcode: "8901234567009",
        categoryId: household.id,
        purchasePrice: 420,
        sellingPrice: 520,
        quantity: 35,
        reorderLevel: 10,
        unit: Unit.PCS,
        supplierId: unilever.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lifebuoy Soap 130g",
        sku: "PCR-LFB-010",
        barcode: "8901234567010",
        categoryId: personalCare.id,
        purchasePrice: 85,
        sellingPrice: 110,
        quantity: 4,
        reorderLevel: 12,
        unit: Unit.PCS,
        supplierId: unilever.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Colgate MaxFresh Toothpaste 100g",
        sku: "PCR-CLT-011",
        barcode: "8901234567011",
        categoryId: personalCare.id,
        purchasePrice: 220,
        sellingPrice: 280,
        quantity: 40,
        reorderLevel: 10,
        unit: Unit.PCS,
        supplierId: unilever.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Basmati Rice Super Kernel 5kg",
        sku: "GRC-RIC-012",
        barcode: "8901234567012",
        categoryId: groceries.id,
        purchasePrice: 1800,
        sellingPrice: 2200,
        quantity: 22,
        reorderLevel: 6,
        unit: Unit.PCS,
        supplierId: nfd.id,
      },
    }),
  ]);

  const now = new Date();

  for (let i = 0; i < 25; i++) {
    const day = subDays(now, Math.floor(Math.random() * 30));
    const saleDate = addHours(day, 9 + Math.floor(Math.random() * 10));
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const selected = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);

    const items = selected.map((p) => {
      const qty = 1 + Math.floor(Math.random() * 3);
      const unitPrice = Number(p.sellingPrice);
      const purchasePrice = Number(p.purchasePrice);
      const discount = 0;
      const total = unitPrice * qty - discount;
      return {
        productId: p.id,
        quantity: qty,
        unitPrice,
        purchasePrice,
        discount,
        total,
      };
    });

    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal - discount;
    const methods: PaymentMethod[] = [PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.ONLINE];

    await prisma.sale.create({
      data: {
        invoiceNumber: `INV-${String(1000 + i).padStart(5, "0")}`,
        discount,
        subtotal,
        total,
        paymentMethod: methods[i % 3],
        notes: i % 7 === 0 ? "Regular customer" : null,
        createdAt: saleDate,
        items: { create: items },
      },
    });
  }

  const expenseData: Array<{
    category: ExpenseCategory;
    amount: number;
    description: string;
    daysAgo: number;
    isRecurring?: boolean;
    recurringInterval?: string;
  }> = [
    { category: ExpenseCategory.RENT, amount: 75000, description: "Shop rent - Gulshan", daysAgo: 5, isRecurring: true, recurringInterval: "monthly" },
    { category: ExpenseCategory.UTILITIES, amount: 12500, description: "KE electricity bill", daysAgo: 8 },
    { category: ExpenseCategory.SALARIES, amount: 45000, description: "Staff salaries", daysAgo: 3, isRecurring: true, recurringInterval: "monthly" },
    { category: ExpenseCategory.TRANSPORT, amount: 3500, description: "Delivery van fuel", daysAgo: 2 },
    { category: ExpenseCategory.PURCHASE_OF_GOODS, amount: 85000, description: "Weekly stock purchase from NFD", daysAgo: 10 },
    { category: ExpenseCategory.MISC, amount: 2000, description: "Shop cleaning supplies", daysAgo: 12 },
    { category: ExpenseCategory.UTILITIES, amount: 4500, description: "SSGC gas bill", daysAgo: 15 },
    { category: ExpenseCategory.TRANSPORT, amount: 1800, description: "Courier for supplier order", daysAgo: 18 },
    { category: ExpenseCategory.PURCHASE_OF_GOODS, amount: 42000, description: "Engro dairy restock", daysAgo: 20 },
    { category: ExpenseCategory.MISC, amount: 5000, description: "POS paper rolls & stationery", daysAgo: 25 },
  ];

  for (const e of expenseData) {
    await prisma.expense.create({
      data: {
        category: e.category,
        amount: e.amount,
        description: e.description,
        date: subDays(now, e.daysAgo),
        isRecurring: e.isRecurring ?? false,
        recurringInterval: e.recurringInterval,
      },
    });
  }

  await prisma.stockMovement.createMany({
    data: [
      {
        productId: products[0].id,
        type: StockMovementType.IN,
        quantity: 50,
        reason: "Initial stock",
        reference: "PO-1001",
        createdAt: subDays(now, 28),
      },
      {
        productId: products[1].id,
        type: StockMovementType.IN,
        quantity: 30,
        reason: "Supplier delivery",
        reference: "PO-1002",
        createdAt: subDays(now, 20),
      },
      {
        productId: products[7].id,
        type: StockMovementType.OUT,
        quantity: 10,
        reason: "Damaged stock write-off",
        reference: "ADJ-01",
        createdAt: subDays(now, 7),
      },
      {
        productId: products[9].id,
        type: StockMovementType.OUT,
        quantity: 8,
        reason: "Sale adjustment",
        createdAt: subDays(now, 4),
      },
      {
        productId: products[4].id,
        type: StockMovementType.IN,
        quantity: 48,
        reason: "Restock from Engro",
        reference: "PO-1003",
        createdAt: subDays(now, 2),
      },
    ],
  });

  console.log("Seed completed successfully.");
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
