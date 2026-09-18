import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Charge,
  ChargeInput,
  ExpenseInput,
  Income,
  IncomeInput,
  Transaction,
} from "../types";
import { financeService } from "../services/financeService";

interface FinanceContextValue {
  transactions: Transaction[];
  charges: Charge[];
  loading: boolean;
  addExpense: (input: ExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>;
  addIncome: (input: IncomeInput) => Promise<void>;
  updateIncome: (id: string, input: IncomeInput) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  setTransactionStatus: (id: string, status: "paid" | "pending") => Promise<void>;
  duplicateTransaction: (id: string) => Promise<void>;
  addCharge: (input: ChargeInput) => Promise<void>;
  updateCharge: (id: string, input: ChargeInput) => Promise<void>;
  removeCharge: (id: string) => Promise<void>;
  settleCharge: (id: string) => Promise<void>;
  cancelCharge: (id: string) => Promise<void>;
  duplicateCharge: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    financeService.fetchAll().then((data) => {
      if (!active) return;
      setTransactions(data.transactions);
      setCharges(data.charges);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const addExpense = useCallback(async (input: ExpenseInput) => {
    const created = await financeService.createExpense(input);
    setTransactions((prev) => [created, ...prev]);
  }, []);

  const updateExpense = useCallback(async (id: string, input: ExpenseInput) => {
    const updated = await financeService.updateExpense(id, {
      ...input,
      dueDate: input.status === "pending" ? input.date : undefined,
    });
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const addIncome = useCallback(async (input: IncomeInput) => {
    const created = await financeService.createIncome(input);
    setTransactions((prev) => [created, ...prev]);
  }, []);

  const updateIncome = useCallback(async (id: string, input: IncomeInput) => {
    const updated = await financeService.updateIncome(id, input);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const removeTransaction = useCallback(
    async (id: string) => {
      const source = transactions.find((t) => t.id === id);
      if (!source) return;
      if (source.type === "expense") {
        await financeService.deleteExpense(id);
      } else {
        await financeService.deleteIncome(id);
      }
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    },
    [transactions],
  );

  const setTransactionStatus = useCallback(async (id: string, status: "paid" | "pending") => {
    const updated = await financeService.updateExpense(id, { status });
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const duplicateTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev);
      const source = transactions.find((t) => t.id === id);
      if (!source) return;
      if (source.type === "expense") {
        const created = await financeService.createExpense({
          description: `${source.description} (cópia)`,
          amount: source.amount,
          date: source.date,
          categoryId: source.categoryId,
          paymentMethod: source.paymentMethod,
          status: source.status,
          notes: source.notes,
          recurrence: source.recurrence,
        });
        setTransactions((prev) => [created, ...prev]);
      } else {
        const created = await financeService.createIncome({
          description: `${source.description} (cópia)`,
          amount: source.amount,
          date: source.date,
          categoryId: source.categoryId,
          status: (source as Income).status,
          notes: source.notes,
          recurrence: source.recurrence,
        });
        setTransactions((prev) => [created, ...prev]);
      }
    },
    [transactions],
  );

  const addCharge = useCallback(async (input: ChargeInput) => {
    const created = await financeService.createCharge(input);
    setCharges((prev) => [created, ...prev]);
  }, []);

  const updateCharge = useCallback(async (id: string, input: ChargeInput) => {
    const updated = await financeService.updateCharge(id, input);
    setCharges((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const removeCharge = useCallback(async (id: string) => {
    await financeService.deleteCharge(id);
    setCharges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const settleCharge = useCallback(async (id: string) => {
    const { charge, income } = await financeService.settleCharge(id);
    setCharges((prev) => prev.map((c) => (c.id === id ? charge : c)));
    setTransactions((prev) => [income, ...prev]);
  }, []);

  const cancelCharge = useCallback(async (id: string) => {
    const updated = await financeService.updateCharge(id, { status: "canceled" });
    setCharges((prev) => prev.map((c) => (c.id === id ? updated : c)));
  }, []);

  const duplicateCharge = useCallback(
    async (id: string) => {
      const source = charges.find((c) => c.id === id);
      if (!source) return;
      const created = await financeService.createCharge({
        clientName: source.clientName,
        description: `${source.description} (cópia)`,
        amount: source.amount,
        dueDate: source.dueDate,
        notes: source.notes,
        recurrence: source.recurrence,
      });
      setCharges((prev) => [created, ...prev]);
    },
    [charges],
  );

  const value = useMemo<FinanceContextValue>(
    () => ({
      transactions,
      charges,
      loading,
      addExpense,
      updateExpense,
      addIncome,
      updateIncome,
      removeTransaction,
      setTransactionStatus,
      duplicateTransaction,
      addCharge,
      updateCharge,
      removeCharge,
      settleCharge,
      cancelCharge,
      duplicateCharge,
    }),
    [
      transactions,
      charges,
      loading,
      addExpense,
      updateExpense,
      addIncome,
      updateIncome,
      removeTransaction,
      setTransactionStatus,
      duplicateTransaction,
      addCharge,
      updateCharge,
      removeCharge,
      settleCharge,
      cancelCharge,
      duplicateCharge,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}
