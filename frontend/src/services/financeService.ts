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
} from "../types";
import { api } from "./api";

export const financeService = {
  async fetchAll(): Promise<{ transactions: Transaction[]; charges: Charge[] }> {
    return api.get("/finance/all");
  },

  // ----- expenses -----
  createExpense(input: ExpenseInput): Promise<Expense> {
    return api.post("/expenses", input);
  },

  updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
    return api.patch(`/expenses/${id}`, patch);
  },

  deleteExpense(id: string): Promise<void> {
    return api.delete(`/expenses/${id}`);
  },

  // ----- incomes -----
  createIncome(input: IncomeInput): Promise<Income> {
    return api.post("/incomes", input);
  },

  updateIncome(id: string, patch: Partial<Income>): Promise<Income> {
    return api.patch(`/incomes/${id}`, patch);
  },

  deleteIncome(id: string): Promise<void> {
    return api.delete(`/incomes/${id}`);
  },

  // ----- charges -----
  createCharge(input: ChargeInput): Promise<Charge> {
    return api.post("/charges", input);
  },

  updateCharge(id: string, patch: Partial<Charge>): Promise<Charge> {
    return api.patch(`/charges/${id}`, patch);
  },

  deleteCharge(id: string): Promise<void> {
    return api.delete(`/charges/${id}`);
  },

  /**
   * Settling a charge creates a *real* income transaction, atomically, on
   * the server. A pending charge is never counted as income.
   */
  async settleCharge(id: string): Promise<{ charge: Charge; income: Income }> {
    return api.post(`/charges/${id}/settle`, {});
  },
};
