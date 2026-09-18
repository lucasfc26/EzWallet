import type {
  Charge,
  Expense,
  FinancialSummary,
  Income,
  Period,
  Transaction,
  Category,
} from "../types";
import { fromISO, isInPeriod, periodBuckets } from "./dates";
import { sum } from "./money";
import { getCategory } from "../data/categories";

export const isExpense = (t: Transaction): t is Expense => t.type === "expense";
export const isIncome = (t: Transaction): t is Income => t.type === "income";

export function inPeriod(transactions: Transaction[], period: Period): Transaction[] {
  return transactions.filter((t) => isInPeriod(t.date, period));
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => fromISO(b.date).getTime() - fromISO(a.date).getTime(),
  );
}

export function buildSummary(
  transactions: Transaction[],
  charges: Charge[],
  period: Period,
): FinancialSummary {
  const scoped = inPeriod(transactions, period);
  const incomes = scoped.filter(isIncome).filter((i) => i.status === "received");
  const expenses = scoped.filter(isExpense);

  const incomeTotal = sum(incomes.map((i) => i.amount));
  const expensesTotal = sum(expenses.map((e) => e.amount));
  const paidExpenses = sum(
    expenses.filter((e) => e.status === "paid").map((e) => e.amount),
  );
  const toPay = sum(expenses.filter((e) => e.status === "pending").map((e) => e.amount));

  // all-time balance considering everything settled until the end of the period
  const end = fromISO(period.to).getTime();
  const untilEnd = transactions.filter((t) => fromISO(t.date).getTime() <= end);
  const balance =
    sum(untilEnd.filter(isIncome).filter((i) => i.status === "received").map((i) => i.amount)) -
    sum(untilEnd.filter(isExpense).filter((e) => e.status === "paid").map((e) => e.amount));

  const toReceive = sum(
    charges.filter((c) => c.status === "pending").map((c) => c.amount),
  );

  return {
    income: incomeTotal,
    expenses: expensesTotal,
    paidExpenses,
    toPay,
    toReceive,
    balance,
    periodResult: incomeTotal - expensesTotal,
    spendingRatio: incomeTotal > 0 ? expensesTotal / incomeTotal : 0,
  };
}

export interface BucketPoint {
  label: string;
  receitas: number;
  despesas: number;
}

export function buildBuckets(
  transactions: Transaction[],
  period: Period,
): BucketPoint[] {
  const buckets = periodBuckets(period);
  return buckets.map((b) => {
    const range: Period = { preset: "custom", from: b.from, to: b.to };
    const scoped = inPeriod(transactions, range);
    return {
      label: b.label,
      receitas:
        sum(
          scoped
            .filter(isIncome)
            .filter((i) => i.status === "received")
            .map((i) => i.amount),
        ) / 100,
      despesas: sum(scoped.filter(isExpense).map((e) => e.amount)) / 100,
    };
  });
}

export interface CategorySlice {
  id: string;
  name: string;
  color: string;
  value: number; // cents
  share: number; // 0..100
}

export function buildCategoryBreakdown(
  transactions: Transaction[],
  period: Period,
  categories: Category[] = [],
  kind: "expense" | "income" = "expense",
): CategorySlice[] {
  const scoped = inPeriod(transactions, period).filter((t) =>
    kind === "income" ? isIncome(t) && t.status === "received" : isExpense(t),
  );
  const total = sum(scoped.map((item) => item.amount));
  const map = new Map<string, number>();
  scoped.forEach((item) => {
    map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + item.amount);
  });
  return [...map.entries()]
    .map(([id, value]) => {
      const cat = getCategory(id, categories);
      return {
        id,
        name: cat.name,
        color: cat.color,
        value,
        share: total > 0 ? (value / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export interface DayGroup {
  date: string;
  items: Transaction[];
  expenseTotal: number;
  incomeTotal: number;
}

export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const map = new Map<string, Transaction[]>();
  sortByDateDesc(transactions).forEach((t) => {
    const list = map.get(t.date) ?? [];
    list.push(t);
    map.set(t.date, list);
  });
  return [...map.entries()].map(([date, items]) => ({
    date,
    items,
    expenseTotal: sum(items.filter(isExpense).map((t) => t.amount)),
    incomeTotal: sum(
      items.filter(isIncome).filter((i) => i.status === "received").map((t) => t.amount),
    ),
  }));
}

export function isChargeOverdue(charge: Charge): boolean {
  if (charge.status !== "pending") return false;
  return fromISO(charge.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
}

export function upcomingBills(transactions: Transaction[], limit = 5): Expense[] {
  return transactions
    .filter(isExpense)
    .filter((e) => e.status === "pending")
    .sort(
      (a, b) =>
        fromISO(a.dueDate ?? a.date).getTime() - fromISO(b.dueDate ?? b.date).getTime(),
    )
    .slice(0, limit);
}
