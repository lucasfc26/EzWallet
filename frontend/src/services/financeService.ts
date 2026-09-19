/**
 * Talks to the real NestJS API instead of localStorage. Same exported shape
 * the mock version had (see git history) — useFinance.tsx composes these
 * into the same generic transaction-level actions the UI already uses.
 */
import type {
  Charge,
  ChargeInput,
  Expense,
  ExpenseInput,
  Income,
  IncomeInput,
  Transaction,
  Category,
  CategoryInput,
  PaymentCard,
  CardInput,
  PaymentOption,
  PaymentOptionInput,
} from "../types";
import { api } from "./api";

export const financeService = {
  async fetchAll(): Promise<{
    transactions: Transaction[];
    charges: Charge[];
    categories: Category[];
    cards: PaymentCard[];
    paymentOptions: PaymentOption[];
  }> {
    return api.get("/finance/all");
  },

  createExpense(input: ExpenseInput): Promise<Expense[]> {
    return api.post("/expenses", input);
  },

  updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
    return api.patch(`/expenses/${id}`, patch);
  },

  deleteExpense(id: string): Promise<void> {
    return api.delete(`/expenses/${id}`);
  },

  createIncome(input: IncomeInput): Promise<Income[]> {
    return api.post("/incomes", input);
  },

  updateIncome(id: string, patch: Partial<Income>): Promise<Income> {
    return api.patch(`/incomes/${id}`, patch);
  },

  deleteIncome(id: string): Promise<void> {
    return api.delete(`/incomes/${id}`);
  },

  createCharge(input: ChargeInput): Promise<{ charges: Charge[]; incomes: Income[] }> {
    return api.post("/charges", input);
  },

  updateCharge(id: string, patch: Partial<Charge>): Promise<Charge> {
    return api.patch(`/charges/${id}`, patch);
  },

  deleteCharge(id: string): Promise<void> {
    return api.delete(`/charges/${id}`);
  },

  async settleCharge(id: string): Promise<{ charge: Charge; income: Income }> {
    return api.post(`/charges/${id}/settle`, {});
  },

  createCategory(input: CategoryInput): Promise<Category> {
    return api.post("/categories", input);
  },

  updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
    return api.patch(`/categories/${id}`, input);
  },

  deleteCategory(id: string): Promise<void> {
    return api.delete(`/categories/${id}`);
  },

  createCard(input: CardInput): Promise<PaymentCard> {
    return api.post("/cards", input);
  },

  updateCard(id: string, input: Partial<CardInput>): Promise<PaymentCard> {
    return api.patch(`/cards/${id}`, input);
  },

  deleteCard(id: string): Promise<void> {
    return api.delete(`/cards/${id}`);
  },

  createPaymentOption(input: PaymentOptionInput): Promise<PaymentOption> {
    return api.post("/payment-options", input);
  },

  updatePaymentOption(id: string, input: Partial<PaymentOptionInput>): Promise<PaymentOption> {
    return api.patch(`/payment-options/${id}`, input);
  },

  deletePaymentOption(id: string): Promise<void> {
    return api.delete(`/payment-options/${id}`);
  },
};
