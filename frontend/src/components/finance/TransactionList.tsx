import type { ReactNode } from "react";
import type { Transaction } from "../../types";
import { getCategory } from "../../data/categories";
import { formatCents } from "../../lib/money";
import { formatBR } from "../../lib/dates";
import { CategoryIcon } from "./CategoryBadge";
import { TransactionStatusBadge } from "./StatusBadge";
import { cn } from "../../utils/cn";

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
  const category = getCategory(transaction.categoryId);
  const isIncome = transaction.type === "income";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors sm:px-5",
        onClick && "cursor-pointer hover:bg-slate-50",
      )}
      onClick={onClick}
    >
      <CategoryIcon categoryId={transaction.categoryId} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-slate-900">
          {transaction.description}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
          <span>{category.name}</span>
          <span className="text-slate-300">•</span>
          <span>{formatBR(transaction.date)}</span>
          {showStatus && transaction.status !== "paid" && transaction.status !== "received" && (
            <>
              <span className="text-slate-300">•</span>
              <TransactionStatusBadge transaction={transaction} />
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "text-[13.5px] font-semibold tabular-nums whitespace-nowrap",
            isIncome ? "text-emerald-600" : "text-slate-900",
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
    <ul className="divide-y divide-slate-100">
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
