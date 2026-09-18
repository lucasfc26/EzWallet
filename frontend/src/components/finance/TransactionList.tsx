import type { ReactNode } from "react";
import type { Transaction } from "../../types";
import { getCategory } from "../../data/categories";
import { formatCents } from "../../lib/money";
import { formatBR } from "../../lib/dates";
import { CategoryIcon } from "./CategoryBadge";
import { TransactionStatusBadge } from "./StatusBadge";
import { cn } from "../../utils/cn";
import { useFinance } from "../../hooks/useFinance";

export function TransactionItem({
  transaction,
  action,
  showStatus = true,
  onClick,
}: {
  transaction: Transaction;
  action?: ReactNode;
  showStatus?: boolean;
  onClick?: () => void;
}) {
  const { categories } = useFinance();
  const category = getCategory(transaction.categoryId, categories);
  const isIncome = transaction.type === "income";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors sm:px-5",
        onClick && "cursor-pointer hover:bg-surface-secondary",
      )}
      onClick={onClick}
    >
      <CategoryIcon categoryId={transaction.categoryId} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-foreground">
          {transaction.description}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-foreground-secondary">
          <span>{category.name}</span>
          <span className="text-foreground-muted">•</span>
          <span>{formatBR(transaction.date)}</span>
          {showStatus && transaction.status !== "paid" && transaction.status !== "received" && (
            <>
              <span className="text-foreground-muted">•</span>
              <TransactionStatusBadge transaction={transaction} />
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[13.5px] font-semibold tabular-nums whitespace-nowrap",
            isIncome ? "text-success" : "text-foreground",
          )}
        >
          {isIncome ? "+" : "−"} {formatCents(transaction.amount)}
        </span>
        {action}
      </div>
    </div>
  );
}

export function TransactionList({
  transactions,
  emptyState,
  renderAction,
  onItemClick,
}: {
  transactions: Transaction[];
  emptyState?: ReactNode;
  renderAction?: (t: Transaction) => ReactNode;
  onItemClick?: (t: Transaction) => void;
}) {
  if (transactions.length === 0) return <>{emptyState}</>;
  return (
    <ul className="divide-y divide-border">
      {transactions.map((t) => (
        <li key={t.id}>
          <TransactionItem
            transaction={t}
            action={renderAction?.(t)}
            onClick={onItemClick ? () => onItemClick(t) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
