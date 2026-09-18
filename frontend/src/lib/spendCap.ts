import type { Transaction } from "../types";
import { buildPeriod } from "./dates";
import { inPeriod, isExpense } from "./selectors";
import { formatCents, sum } from "./money";

export const SPEND_CAP_WARN_RATIO = 0.8;

export function monthlyExpenseTotal(transactions: Transaction[], ref = new Date()): number {
  const period = buildPeriod("month", ref);
  return sum(inPeriod(transactions, period).filter(isExpense).map((e) => e.amount));
}

export type SpendCapLevel = "ok" | "warning" | "over";

export function spendCapLevel(spent: number, cap: number | null | undefined): SpendCapLevel {
  if (!cap || cap <= 0) return "ok";
  if (spent >= cap) return "over";
  if (spent >= cap * SPEND_CAP_WARN_RATIO) return "warning";
  return "ok";
}

export function spendCapMessage(spent: number, cap: number, level: SpendCapLevel): { title: string; description: string } {
  const ratio = Math.round((spent / cap) * 100);
  if (level === "over") {
    return {
      title: "Você ultrapassou o teto mensal de gastos",
      description: `${formatCents(spent)} de ${formatCents(cap)} neste mês (${ratio}%).`,
    };
  }
  return {
    title: "Você está próximo do teto mensal de gastos",
    description: `${formatCents(spent)} de ${formatCents(cap)} neste mês (${ratio}%).`,
  };
}
