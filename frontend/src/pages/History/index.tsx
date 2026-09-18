import { useMemo, useState } from "react";
import { History as HistoryIcon, Search } from "lucide-react";
import { PageHeader } from "../../components/finance/PageHeader";
import { PeriodFilter } from "../../components/finance/PeriodFilter";
import { Card, CardBody } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/Tabs";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { TransactionItem } from "../../components/finance/TransactionList";
import { CatalogFilters } from "../../components/finance/CatalogFilters";
import { useFinance } from "../../hooks/useFinance";
import { buildPeriod, formatLongDay, periodLabel, relativeDayLabel } from "../../lib/dates";
import { formatCents } from "../../lib/money";
import { filterTransactions } from "../../lib/filters";
import { buildSummary, groupByDay, inPeriod } from "../../lib/selectors";
import type { Period, Transaction } from "../../types";
import { cn } from "../../utils/cn";

type Filter = "all" | "expenses" | "incomes" | "charges" | "paid";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tudo" },
  { value: "expenses", label: "Gastos" },
  { value: "incomes", label: "Receitas" },
  { value: "charges", label: "Receitas recebidas" },
  { value: "paid", label: "Contas pagas" },
];

function matchFilter(t: Transaction, filter: Filter): boolean {
  switch (filter) {
    case "expenses":
      return t.type === "expense";
    case "incomes":
      return t.type === "income";
    case "charges":
      return t.type === "income" && Boolean(t.chargeId);
    case "paid":
      return t.type === "expense" && t.status === "paid";
    default:
      return true;
  }
}

export default function HistoryPage() {
  const { transactions, charges, categories, cards, paymentOptions, loading } = useFinance();
  const [period, setPeriod] = useState<Period>(() => buildPeriod("month"));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [payment, setPayment] = useState("all");

  const cataloged = useMemo(
    () => filterTransactions(transactions, categoryId, payment),
    [transactions, categoryId, payment],
  );

  const scoped = useMemo(() => {
    const term = query.trim().toLowerCase();
    return inPeriod(cataloged, period)
      .filter((t) => matchFilter(t, filter))
      .filter((t) => (term ? t.description.toLowerCase().includes(term) : true));
  }, [cataloged, period, filter, query]);

  const groups = useMemo(() => groupByDay(scoped), [scoped]);
  const summary = useMemo(
    () => buildSummary(cataloged, categoryId === "all" && payment === "all" ? charges : [], period),
    [cataloged, charges, period, categoryId, payment],
  );

  return (
    <>
      <PageHeader
        title="Histórico"
        subtitle={`Todas as movimentações de ${periodLabel(period).toLowerCase()}`}
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <PeriodFilter period={period} onChange={setPeriod} />
          <CatalogFilters
            categories={categories}
            paymentOptions={paymentOptions}
            cards={cards}
            categoryId={categoryId}
            payment={payment}
            onCategoryChange={setCategoryId}
            onPaymentChange={setPayment}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs paged items={FILTERS} value={filter} onChange={setFilter} size="sm" />
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar movimentação..."
              className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-[13px] text-foreground-secondary placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-3 gap-3 py-4">
          <div>
            <p className="text-[12px] font-medium text-foreground-secondary">Receitas</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums text-success">
              {formatCents(summary.income)}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-foreground-secondary">Despesas</p>
            <p className="mt-1 text-[17px] font-semibold tabular-nums text-danger">
              {formatCents(summary.expenses)}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium text-foreground-secondary">Saldo do período</p>
            <p
              className={cn(
                "mt-1 text-[17px] font-semibold tabular-nums",
                summary.periodResult >= 0 ? "text-foreground" : "text-danger",
              )}
            >
              {formatCents(summary.periodResult)}
            </p>
          </div>
        </CardBody>
      </Card>

      {loading ? (
        <Card>
          <LoadingState label="Carregando histórico..." />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HistoryIcon className="h-5 w-5" />}
            title="Nenhuma movimentação encontrada"
            description="Tente ajustar o período, o filtro ou a busca."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.date} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-secondary/60 px-4 py-2.5 sm:px-5">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-[13.5px] font-semibold text-foreground">
                    {relativeDayLabel(group.date)}
                  </h3>
                  <span className="text-[12px] text-foreground-muted">
                    {formatLongDay(group.date)} • {group.items.length} movimentaç
                    {group.items.length === 1 ? "ão" : "ões"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] tabular-nums">
                  {group.incomeTotal > 0 && (
                    <span className="font-medium text-success">
                      + {formatCents(group.incomeTotal)}
                    </span>
                  )}
                  {group.expenseTotal > 0 && (
                    <span className="font-medium text-danger">
                      − {formatCents(group.expenseTotal)}
                    </span>
                  )}
                </div>
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((t) => (
                  <li key={t.id}>
                    <TransactionItem transaction={t} />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
