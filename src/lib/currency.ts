export function formatPKR(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const safe = Number.isFinite(value) ? value : 0;
  return `Rs. ${safe.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function parseAmount(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
