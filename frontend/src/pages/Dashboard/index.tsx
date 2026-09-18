import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  HandCoins,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../../components/finance/PageHeader";
import { PeriodFilter } from "../../components/finance/PeriodFilter";
import { SummaryCard } from "../../components/finance/SummaryCard";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { Badge } from "../../components/ui/Badge";
import { TransactionList } from "../../components/finance/TransactionList";
import { CashflowChart, CategoryDonut } from "./Charts";
import { ExpenseFormModal } from "../../components/finance/ExpenseFormModal";
import { ChargeFormModal } from "../../components/finance/ChargeFormModal";
import { IncomeFormModal } from "../../components/finance/IncomeFormModal";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import { buildPeriod, dueLabel, formatBR, isOverdue } from "../../lib/dates";
import { formatCents, percent } from "../../lib/money";
import {
  buildBuckets,
  buildCategoryBreakdown,
  buildSummary,
  inPeriod,
  sortByDateDesc,
  upcomingBills,
} from "../../lib/selectors";
import type { Period } from "../../types";
import { cn } from "../../utils/cn";

export default function DashboardPage() {
  const { transactions, charges, loading, setTransactionStatus } = useFinance();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>(() => buildPeriod("month"));
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

  const summary = useMemo(
    () => buildSummary(transactions, charges, period),
    [transactions, charges, period],
  );
  const buckets = useMemo(() => buildBuckets(transactions, period), [transactions, period]);
  const categories = useMemo(
    () => buildCategoryBreakdown(transactions, period),
    [transactions, period],
  );
  const recent = useMemo(
    () => sortByDateDesc(inPeriod(transactions, period)).slice(0, 6),
    [transactions, period],
  );
  const bills = useMemo(() => upcomingBills(transactions, 5), [transactions]);

  const ratio = Math.min(100, percent(summary.expenses, summary.income));

  const markPaid = async (id: string, description: string) => {
    await setTransactionStatus(id, "paid");
    toast("Conta marcada como paga.", { description });
  };

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Acompanhe seu saldo, receitas e despesas em um só lugar."
        actions={
          <>
            <Button
              variant="outline"
              icon={<HandCoins className="h-4 w-4" />}
              onClick={() => setChargeOpen(true)}
            >
              Nova cobrança
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setExpenseOpen(true)}>
              Novo gasto
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <PeriodFilter period={period} onChange={setPeriod} />
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowUpRight className="h-3.5 w-3.5" />}
          onClick={() => setIncomeOpen(true)}
        >
          Registrar receita
        </Button>
      </div>

      {loading ? (
        <Card>
          <LoadingState label="Carregando suas finanças..." />
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <SummaryCard
              label="Saldo disponível"
              value={summary.balance}
              icon={<Wallet className="h-3.5 w-3.5" />}
              highlight
              hint="Receitas recebidas − contas pagas"
            />
            <SummaryCard
              label="Receitas"
              value={summary.income}
              tone="green"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              hint="Recebidas no período"
            />
            <SummaryCard
              label="Despesas"
              value={summary.expenses}
              tone="red"
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              hint={`${formatCents(summary.paidExpenses)} já pagos`}
            />
            <SummaryCard
              label="A receber"
              value={summary.toReceive}
              tone="violet"
              icon={<HandCoins className="h-3.5 w-3.5" />}
              hint="Cobranças pendentes"
            />
            <SummaryCard
              label="A pagar"
              value={summary.toPay}
              tone="amber"
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              hint="Contas do período"
            />
          </div>

          {/* Comparison */}
          <Card>
            <CardBody className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-[12px] font-medium text-slate-500">
                  Receitas x despesas
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums text-emerald-600">
                    {formatCents(summary.income)}
                  </span>
                  <span className="text-xs text-slate-400">vs</span>
                  <span className="text-lg font-semibold tabular-nums text-rose-600">
                    {formatCents(summary.expenses)}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      ratio > 90 ? "bg-rose-500" : ratio > 70 ? "bg-amber-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500">
                  Resultado do período
                </p>
                <p
                  className={cn(
                    "mt-2 text-lg font-semibold tabular-nums",
                    summary.periodResult >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {summary.periodResult >= 0 ? "+" : "−"}{" "}
                  {formatCents(Math.abs(summary.periodResult))}
                </p>
                <p className="mt-2.5 text-[12px] text-slate-400">
                  Saldo acumulado de {formatCents(summary.balance)}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-slate-500">
                  Gastos sobre receitas
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums text-slate-900">
                  {percent(summary.expenses, summary.income)}%
                </p>
                <p className="mt-2.5 text-[12px] text-slate-400">
                  {summary.income === 0
                    ? "Sem receitas registradas no período"
                    : ratio > 90
                      ? "Atenção: gastos próximos das receitas"
                      : "Dentro de um patamar saudável"}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader
                title="Receitas e despesas"
                description="Comparativo por período"
                action={
                  <div className="flex items-center gap-3 text-[11.5px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receitas
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> Despesas
                    </span>
                  </div>
                }
              />
              <CardBody className="pt-4">
                <CashflowChart data={buckets} />
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Gastos por categoria" />
              <CardBody>
                {categories.length === 0 ? (
                  <EmptyState
                    title="Nenhum gasto no período"
                    description="Adicione gastos para visualizar a distribuição."
                  />
                ) : (
                  <>
                    <CategoryDonut data={categories} />
                    <ul className="mt-3 space-y-2">
                      {categories.slice(0, 4).map((c) => (
                        <li key={c.id} className="flex items-center gap-2 text-[12.5px]">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="flex-1 truncate text-slate-600">{c.name}</span>
                          <span className="tabular-nums font-medium text-slate-900">
                            {formatCents(c.value)}
                          </span>
                          <span className="w-9 text-right tabular-nums text-slate-400">
                            {Math.round(c.share)}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Lists */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader
                title="Últimas movimentações"
                description="Transações mais recentes do período"
                action={
                  <Link
                    to="/historico"
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Ver histórico completo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              />
              <TransactionList
                transactions={recent}
                emptyState={
                  <EmptyState
                    icon={<Receipt className="h-5 w-5" />}
                    title="Nenhuma movimentação neste período"
                    description="Cadastre um gasto ou receita para começar."
                    action={
                      <Button size="sm" onClick={() => setExpenseOpen(true)}>
                        Adicionar gasto
                      </Button>
                    }
                  />
                }
              />
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Contas próximas do vencimento"
                description="Despesas ainda pendentes"
              />
              {bills.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  title="Nenhuma conta pendente"
                  description="Tudo em dia por aqui."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {bills.map((bill) => {
                    const due = bill.dueDate ?? bill.date;
                    const late = isOverdue(due);
                    return (
                      <li
                        key={bill.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium text-slate-900">
                            {bill.description}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-slate-500">
                            <span>{formatBR(due)}</span>
                            <Badge tone={late ? "red" : "amber"}>{dueLabel(due)}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[13.5px] font-semibold tabular-nums text-slate-900">
                            {formatCents(bill.amount)}
                          </span>
                          <button
                            onClick={() => markPaid(bill.id, bill.description)}
                            className="text-[11.5px] font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                          >
                            Marcar como paga
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <ExpenseFormModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <ChargeFormModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
      <IncomeFormModal open={incomeOpen} onClose={() => setIncomeOpen(false)} />
    </>
  );
}
