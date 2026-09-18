import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Check,
  Copy,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Undo2,
} from "lucide-react";
import { PageHeader } from "../../components/finance/PageHeader";
import { PeriodFilter } from "../../components/finance/PeriodFilter";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { CategoryIcon } from "../../components/finance/CategoryBadge";
import { ExpenseFormModal } from "../../components/finance/ExpenseFormModal";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import { buildPeriod, formatBR, periodLabel } from "../../lib/dates";
import { formatCents, sum } from "../../lib/money";
import { inPeriod, isExpense } from "../../lib/selectors";
import {
  EXPENSE_CATEGORIES,
  getCategory,
  getPaymentMethod,
  RECURRENCE_LABEL,
} from "../../data/categories";
import type { Expense, Period } from "../../types";
import { cn } from "../../utils/cn";

type SortKey = "date" | "amount";
type StatusFilter = "all" | "paid" | "pending";

export default function ExpensesPage() {
  const { transactions, loading, removeTransaction, setTransactionStatus, duplicateTransaction } =
    useFinance();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>(() => buildPeriod("month"));
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const expenses = useMemo(() => {
    let list = inPeriod(transactions, period).filter(isExpense);
    if (category !== "all") list = list.filter((e) => e.categoryId === category);
    if (status !== "all") list = list.filter((e) => e.status === status);
    return [...list].sort((a, b) => {
      const diff =
        sortKey === "amount"
          ? a.amount - b.amount
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [transactions, period, category, status, sortKey, sortAsc]);

  const total = sum(expenses.map((e) => e.amount));
  const pendingTotal = sum(
    expenses.filter((e) => e.status === "pending").map((e) => e.amount),
  );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await removeTransaction(confirmId);
    setConfirmId(null);
    toast("Gasto excluído.", { variant: "info" });
  };

  const toggleStatus = async (expense: Expense) => {
    const next = expense.status === "paid" ? "pending" : "paid";
    await setTransactionStatus(expense.id, next);
    toast(next === "paid" ? "Gasto marcado como pago." : "Gasto voltou para pendente.", {
      description: expense.description,
    });
  };

  const handleDuplicate = async (expense: Expense) => {
    await duplicateTransaction(expense.id);
    toast("Gasto duplicado.", { description: expense.description });
  };

  const menuFor = (expense: Expense) => [
    {
      label: "Editar gasto",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onSelect: () => openEdit(expense),
    },
    {
      label: expense.status === "paid" ? "Marcar como pendente" : "Marcar como pago",
      icon:
        expense.status === "paid" ? (
          <Undo2 className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        ),
      onSelect: () => void toggleStatus(expense),
    },
    {
      label: "Duplicar",
      icon: <Copy className="h-3.5 w-3.5" />,
      onSelect: () => void handleDuplicate(expense),
    },
    {
      label: "Excluir",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      destructive: true,
      onSelect: () => setConfirmId(expense.id),
    },
  ];

  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === key) setSortAsc((v) => !v);
        else {
          setSortKey(key);
          setSortAsc(false);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-slate-700",
        sortKey === key && "text-slate-900",
      )}
    >
      {label}
      <ArrowDownUp className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle={`${periodLabel(period)} • ${expenses.length} lançamento${expenses.length === 1 ? "" : "s"}`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Adicionar gasto
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12px] font-medium text-slate-500">Total no período</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
            {formatCents(total)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-slate-500">Pendentes</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-amber-600">
            {formatCents(pendingTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-slate-500">Média por lançamento</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
            {formatCents(expenses.length ? Math.round(total / expenses.length) : 0)}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <PeriodFilter period={period} onChange={setPeriod} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">Todas as categorias</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
          {(category !== "all" || status !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory("all");
                setStatus("all");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Carregando gastos..." />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="Nenhum gasto encontrado neste período"
            description="Ajuste os filtros ou adicione um novo lançamento."
            action={
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>
                Adicionar gasto
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-[11.5px] font-medium uppercase tracking-wide text-slate-500 [&>th]:bg-slate-50/60">
                    <th className="rounded-tl-2xl px-5 py-3">Descrição</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">{sortButton("date", "Data")}</th>
                    <th className="px-3 py-3">Pagamento</th>
                    <th className="px-3 py-3 text-right">{sortButton("amount", "Valor")}</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="rounded-tr-2xl px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="group transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon categoryId={e.categoryId} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-medium text-slate-900">
                              {e.description}
                            </p>
                            {e.recurrence !== "none" && (
                              <p className="text-[11.5px] text-slate-400">
                                {RECURRENCE_LABEL[e.recurrence]}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-slate-600">
                        {getCategory(e.categoryId).name}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] tabular-nums text-slate-600">
                        {formatBR(e.date)}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-slate-600">
                        {getPaymentMethod(e.paymentMethod).label}
                      </td>
                      <td className="px-3 py-3 text-right text-[13.5px] font-semibold tabular-nums text-slate-900">
                        {formatCents(e.amount)}
                      </td>
                      <td className="px-3 py-3">
                        {e.status === "paid" ? (
                          <Badge tone="green">Pago</Badge>
                        ) : (
                          <Badge tone="amber">Pendente</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu items={menuFor(e)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3.5">
                  <CategoryIcon categoryId={e.categoryId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13.5px] font-medium text-slate-900">
                        {e.description}
                      </p>
                      <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-slate-900">
                        {formatCents(e.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-slate-500">
                      <span>{getCategory(e.categoryId).name}</span>
                      <span className="text-slate-300">•</span>
                      <span>{formatBR(e.date)}</span>
                      <span className="text-slate-300">•</span>
                      <span>{getPaymentMethod(e.paymentMethod).label}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {e.status === "paid" ? (
                        <Badge tone="green">Pago</Badge>
                      ) : (
                        <Badge tone="amber">Pendente</Badge>
                      )}
                      <DropdownMenu items={menuFor(e)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <ExpenseFormModal
        open={formOpen}
        expense={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Excluir gasto"
        message="Essa ação não pode ser desfeita. O lançamento será removido dos seus relatórios."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
