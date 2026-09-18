import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useFinance } from "../../hooks/useFinance";
import { monthlyExpenseTotal, spendCapLevel, spendCapMessage } from "../../lib/spendCap";
import { cn } from "../../utils/cn";

export function SpendCapBanner() {
  const { user } = useAuth();
  const { transactions } = useFinance();
  const cap = user?.monthlySpendCap ?? null;
  const spent = monthlyExpenseTotal(transactions);
  const level = spendCapLevel(spent, cap);

  if (!cap || level === "ok") return null;

  const message = spendCapMessage(spent, cap, level);

  return (
    <div
      className={cn(
        "mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3",
        level === "over"
          ? "border-danger/25 bg-danger-subtle text-danger"
          : "border-warning/25 bg-warning-subtle text-warning",
      )}
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{message.title}</p>
        <p className="mt-0.5 text-[12.5px] opacity-90">{message.description}</p>
        <Link
          to="/configuracoes"
          className="mt-1 inline-block text-[12px] font-medium underline-offset-2 hover:underline"
        >
          Ajustar teto nas configurações
        </Link>
      </div>
    </div>
  );
}
