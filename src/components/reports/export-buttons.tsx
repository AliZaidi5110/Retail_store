"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/currency";

type SaleRow = {
  invoiceNumber: string;
  date: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  total: number;
  items: number;
};

type ExpenseRow = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

type ReportSummary = {
  periodLabel: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenseTotal: number;
  netProfit: number;
  salesCount: number;
  expenseCount: number;
};

type PlSummary = {
  periodLabel: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenseTotal: number;
  netProfit: number;
};

export function SalesExportButtons({
  sales,
  expenses,
  summary,
  storeName,
}: {
  sales: SaleRow[];
  expenses: ExpenseRow[];
  summary: ReportSummary;
  storeName: string;
}) {
  function exportExcel() {
    const book = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet([
      { Metric: "Period", Value: summary.periodLabel },
      { Metric: "Sales revenue", Value: summary.revenue },
      { Metric: "COGS", Value: summary.cogs },
      { Metric: "Gross profit", Value: summary.grossProfit },
      { Metric: "Expenses", Value: summary.expenseTotal },
      { Metric: "Net profit / loss", Value: summary.netProfit },
      { Metric: "Sales count", Value: summary.salesCount },
      { Metric: "Expense count", Value: summary.expenseCount },
    ]);
    XLSX.utils.book_append_sheet(book, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(sales), "Sales");
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(expenses), "Expenses");
    XLSX.writeFile(book, `business-report-${Date.now()}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(storeName, 14, 16);
    doc.setFontSize(11);
    doc.text("Business Report", 14, 24);
    doc.setFontSize(9);
    doc.text(summary.periodLabel, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Metric", "Amount"]],
      body: [
        ["Sales revenue", formatPKR(summary.revenue)],
        ["Cost of goods sold", formatPKR(summary.cogs)],
        ["Gross profit", formatPKR(summary.grossProfit)],
        ["Expenses", formatPKR(summary.expenseTotal)],
        ["Net profit / loss", formatPKR(summary.netProfit)],
      ],
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
      head: [["Invoice", "Date", "Payment", "Items", "Total"]],
      body: sales.map((r) => [
        r.invoiceNumber,
        r.date,
        r.paymentMethod,
        String(r.items),
        formatPKR(r.total),
      ]),
      styles: { fontSize: 7 },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
      head: [["Date", "Category", "Description", "Amount"]],
      body: expenses.map((e) => [
        e.date,
        e.category,
        e.description || "—",
        formatPKR(e.amount),
      ]),
      styles: { fontSize: 7 },
    });

    doc.save(`business-report-${Date.now()}.pdf`);
  }

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <Button type="button" variant="outline" size="sm" onClick={exportExcel}>
        Export Excel
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportPdf}>
        Export PDF
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}

export function ProfitLossExportButtons({
  summary,
  storeName,
}: {
  summary: PlSummary;
  storeName: string;
}) {
  function exportExcel() {
    const rows = [
      { Metric: "Period", Value: summary.periodLabel },
      { Metric: "Revenue", Value: summary.revenue },
      { Metric: "COGS", Value: summary.cogs },
      { Metric: "Gross Profit", Value: summary.grossProfit },
      { Metric: "Expenses", Value: summary.expenseTotal },
      { Metric: "Net Profit", Value: summary.netProfit },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "P&L");
    XLSX.writeFile(book, `profit-loss-${Date.now()}.xlsx`);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(storeName, 14, 16);
    doc.setFontSize(11);
    doc.text("Profit & Loss Report", 14, 24);
    doc.setFontSize(10);
    doc.text(summary.periodLabel, 14, 32);
    autoTable(doc, {
      startY: 38,
      head: [["Metric", "Amount"]],
      body: [
        ["Revenue", formatPKR(summary.revenue)],
        ["Cost of Goods Sold", formatPKR(summary.cogs)],
        ["Gross Profit", formatPKR(summary.grossProfit)],
        ["Operating Expenses", formatPKR(summary.expenseTotal)],
        ["Net Profit / Loss", formatPKR(summary.netProfit)],
      ],
    });
    doc.save(`profit-loss-${Date.now()}.pdf`);
  }

  return (
    <div className="flex flex-wrap gap-2 no-print">
      <Button type="button" variant="outline" size="sm" onClick={exportExcel}>
        Export Excel
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportPdf}>
        Export PDF
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}
