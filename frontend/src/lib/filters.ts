import { encodePaymentValue } from "../data/categories";
import type { Charge, Transaction } from "../types";

export function matchesCategory(transaction: Transaction, categoryId: string): boolean {
  return categoryId === "all" || transaction.categoryId === categoryId;
}

export function matchesPayment(transaction: Transaction, payment: string): boolean {
  if (payment === "all") return true;
  if (transaction.type !== "expense") return false;
  return (
    encodePaymentValue({
      paymentMethod: transaction.paymentMethod,
      paymentCardId: transaction.paymentCardId,
      paymentOptionId: transaction.paymentOptionId,
    }) === payment
  );
}

export function filterTransactions(
  transactions: Transaction[],
  categoryId: string,
  payment: string,
): Transaction[] {
  return transactions.filter(
    (transaction) => matchesCategory(transaction, categoryId) && matchesPayment(transaction, payment),
  );
}

export function chargeMatchesFilters(
  charge: Charge,
  transactions: Transaction[],
  categoryId: string,
  payment: string,
): boolean {
  if (categoryId === "all" && payment === "all") return true;
  if (charge.status !== "received") return true;
  const income = transactions.find((t) => t.type === "income" && t.chargeId === charge.id);
  if (!income) return false;
  return matchesCategory(income, categoryId) && matchesPayment(income, payment);
}
