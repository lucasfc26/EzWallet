import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownUp,
  Check,
  Copy,
  Pencil,
  Plus,
  Receipt,
  Search,
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
import { CatalogFilters } from "../../components/finance/CatalogFilters";
import { ExpenseFormModal } from "../../components/finance/ExpenseFormModal";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import { buildPeriod, formatBR, periodLabel } from "../../lib/dates";
import { formatCents, sum } from "../../lib/money";
import { matchesPayment } from "../../lib/filters";
import { inPeriod, isExpense } from "../../lib/selectors";
import {
  getCategory,
  paymentLabel,
  RECURRENCE_LABEL,
} from "../../data/categories";
import type { Expense, Period } from "../../types";
import { cn } from "../../utils/cn";

type SortKey = "date" | "amount";
type StatusFilter = "all" | "paid" | "pending";

export default function ExpensesPage() {
  const { transactions, categories, cards, paymentOptions, loading, removeTransaction, setTransactionStatus, duplicateTransaction } =
    useFinance();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [period, setPeriod] = useState<Period>(() => buildPeriod("month"));
  const [category, setCategory] = useState<string>("all");
  const [payment, setPayment] = useState<string>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const searching = query.trim().length > 0;

  const expenses = useMemo(() => {
    const base = searching
      ? transactions.filter(isExpense).filter((e) =>
          e.description.toLowerCase().includes(query.trim().toLowerCase()),
        )
      : inPeriod(transactions, period).filter(isExpense);
    let list = base;
    if (category !== "all") list = list.filter((e) => e.categoryId === category);
    if (payment !== "all") list = list.filter((e) => matchesPayment(e, payment));
    if (status !== "all") list = list.filter((e) => e.status === status);
    return [...list].sort((a, b) => {
      const diff =
        sortKey === "amount"
          ? a.amount - b.amount
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      return sortAsc ? diff : -diff;
    });
  }, [transactions, period, category, payment, status, sortKey, sortAsc, query, searching]);

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
        "inline-flex items-center gap-1 transition-colors hover:text-foreground-secondary",
        sortKey === key && "text-foreground",
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
        subtitle={
          searching
            ? `Todos os meses • ${expenses.length} resultado${expenses.length === 1 ? "" : "s"} para “${query.trim()}”`
            : `${periodLabel(period)} • ${expenses.length} lançamento${expenses.length === 1 ? "" : "s"}`
        }
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Adicionar gasto
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12px] font-medium text-foreground-secondary">Total no período</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCents(total)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-foreground-secondary">Pendentes</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-warning">
            {formatCents(pendingTotal)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-foreground-secondary">Média por lançamento</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
            {formatCents(expenses.length ? Math.round(total / expenses.length) : 0)}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              if (next) setSearchParams({ q: next });
              else setSearchParams({});
            }}
            placeholder="Buscar gasto pelo nome, em todos os meses..."
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-[13.5px] text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {!searching && <PeriodFilter period={period} onChange={setPeriod} />}
        <div className="flex flex-wrap items-center gap-2">
          <CatalogFilters
            categories={categories}
            paymentOptions={paymentOptions}
            cards={cards}
            categoryId={category}
            payment={payment}
            onCategoryChange={setCategory}
            onPaymentChange={setPayment}
            categoryKind="expense"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-xl border border-border bg-surface px-3 text-[12.5px] font-medium text-foreground-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
          {(category !== "all" || payment !== "all" || status !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory("all");
                setPayment("all");
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
            title={searching ? "Nenhum gasto encontrado" : "Nenhum gasto encontrado neste período"}
            description={
              searching
                ? "Tente outro nome. A busca percorre todos os meses, do mais recente para trás."
                : "Ajuste os filtros ou adicione um novo lançamento."
            }
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
                  <tr className="border-b border-border text-left text-[11.5px] font-medium uppercase tracking-wide text-foreground-secondary [&>th]:bg-surface-secondary/60">
                    <th className="rounded-tl-2xl px-5 py-3">Descrição</th>
                    <th className="px-3 py-3">Categoria</th>
                    <th className="px-3 py-3">{sortButton("date", "Data")}</th>
                    <th className="px-3 py-3">Pagamento</th>
                    <th className="px-3 py-3 text-right">{sortButton("amount", "Valor")}</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="rounded-tr-2xl px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e) => (
                    <tr key={e.id} className="group transition-colors hover:bg-surface-secondary/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon categoryId={e.categoryId} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[13.5px] font-medium text-foreground">
                              {e.description}
                            </p>
                            {e.recurrence !== "none" && (
                              <p className="text-[11.5px] text-foreground-muted">
                                {RECURRENCE_LABEL[e.recurrence]}
                                {e.recurrenceCount === 0
                                  ? " · Sempre"
                                  : (e.recurrenceCount ?? 1) > 1
                                    ? ` · ${e.recurrenceIndex ?? 1}/${e.recurrenceCount}`
                                    : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-foreground-secondary">
                        {getCategory(e.categoryId, categories).name}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] tabular-nums text-foreground-secondary">
                        {formatBR(e.date)}
                      </td>
                      <td className="px-3 py-3 text-[12.5px] text-foreground-secondary">
                        {paymentLabel(e.paymentMethod, e.paymentCardId, cards, e.paymentOptionId, paymentOptions)}
                      </td>
                      <td className="px-3 py-3 text-right text-[13.5px] font-semibold tabular-nums text-foreground">
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
            <ul className="divide-y divide-border lg:hidden">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3.5">
                  <CategoryIcon categoryId={e.categoryId} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13.5px] font-medium text-foreground">
                        {e.description}
                      </p>
                      <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-foreground">
                        {formatCents(e.amount)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-foreground-secondary">
                      <span>{getCategory(e.categoryId, categories).name}</span>
                      <span className="text-foreground-muted">•</span>
                      <span>{formatBR(e.date)}</span>
                      <span className="text-foreground-muted">•</span>
                      <span>{paymentLabel(e.paymentMethod, e.paymentCardId, cards, e.paymentOptionId, paymentOptions)}</span>
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
