import { paymentSelectOptions } from "../../data/categories";
import type { Category, CategoryKind, PaymentCard, PaymentOption } from "../../types";
import { cn } from "../../utils/cn";

const selectClass =
  "h-9 rounded-xl border border-border bg-surface px-3 text-[12.5px] font-medium text-foreground-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

export function CatalogFilters({
  categories,
  paymentOptions,
  cards,
  categoryId,
  payment,
  onCategoryChange,
  onPaymentChange,
  categoryKind,
  className,
}: {
  categories: Category[];
  paymentOptions: PaymentOption[];
  cards: PaymentCard[];
  categoryId: string;
  payment: string;
  onCategoryChange: (value: string) => void;
  onPaymentChange: (value: string) => void;
  categoryKind?: CategoryKind | "all";
  className?: string;
}) {
  const categoryChoices =
    categoryKind && categoryKind !== "all"
      ? categories.filter((c) => c.kind === categoryKind)
      : categories;
  const payments = paymentSelectOptions(paymentOptions, cards);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <select
        aria-label="Filtrar por categoria"
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">Todas as categorias</option>
        {categoryChoices.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Filtrar por forma de pagamento"
        value={payment}
        onChange={(e) => onPaymentChange(e.target.value)}
        className={selectClass}
      >
        <option value="all">Todas as formas</option>
        {payments.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  );
}
