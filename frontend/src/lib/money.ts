/** Money helpers — every value is an integer amount of cents. */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

export function formatCentsCompact(cents: number): string {
  if (Math.abs(cents) >= 1_000_000_00) {
    return `R$ ${(cents / 1_000_000_00).toFixed(1).replace(".", ",")}mi`;
  }
  if (Math.abs(cents) >= 1_000_00) {
    return `R$ ${(cents / 100_000).toFixed(1).replace(".", ",")}k`;
  }
  return brlCompact.format(cents / 100);
}

export function formatSigned(cents: number): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "-" : "";
  return `${sign}${formatCents(Math.abs(cents))}`;
}

/** "1.234,56" / "1234,56" / "1234.56" -> 123456 */
export function parseCurrencyToCents(value: string): number {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10);
}

/** 123456 -> "1.234,56" (no currency symbol, used by CurrencyInput) */
export function centsToMaskedInput(cents: number): string {
  const negative = cents < 0;
  const str = Math.abs(cents).toString().padStart(3, "0");
  const int = str.slice(0, -2);
  const dec = str.slice(-2);
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped},${dec}`;
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
