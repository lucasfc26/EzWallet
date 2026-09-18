import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea, DatePicker } from "../ui/Field";
import { CurrencyInput } from "../ui/CurrencyInput";
import {
  decodePaymentValue,
  encodePaymentValue,
  paymentSelectOptions,
  RECURRENCE_COUNTS,
  RECURRENCE_OPTIONS,
} from "../../data/categories";
import { buildPeriod, isInPeriod, todayISO } from "../../lib/dates";
import { useFinance } from "../../hooks/useFinance";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { monthlyExpenseTotal, spendCapLevel, spendCapMessage } from "../../lib/spendCap";
import type { Expense, ExpenseInput } from "../../types";
import { cn } from "../../utils/cn";

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Informe uma descrição com pelo menos 2 caracteres"),
  amount: z.number().int().positive("Informe um valor maior que zero"),
  date: z.string().min(1, "Selecione a data"),
  categoryId: z.string().min(1, "Selecione a categoria"),
  payment: z.string().min(1, "Selecione a forma de pagamento"),
  status: z.enum(["paid", "pending"]),
  notes: z.string().max(240, "Máximo de 240 caracteres").optional(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
  recurrenceCount: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  description: "",
  amount: 0,
  date: todayISO(),
  categoryId: "",
  payment: "pix",
  status: "paid",
  notes: "",
  recurrence: "none",
  recurrenceCount: "1",
};

export function ExpenseFormModal({
  open,
  onClose,
  expense,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  expense?: Expense | null;
  defaultDate?: string;
}) {
  const { addExpense, updateExpense, categories, cards, paymentOptions, transactions } = useFinance();
  const { user } = useAuth();
  const { toast } = useToast();
  const descriptionRef = useRef<HTMLInputElement | null>(null);
  const keepOpen = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const expenseCategories = categories.filter((c) => c.kind === "expense");
  const paymentChoices = paymentSelectOptions(paymentOptions, cards);
  const defaultCategoryId =
    (user?.defaultCategoryId && expenseCategories.some((c) => c.id === user.defaultCategoryId)
      ? user.defaultCategoryId
      : expenseCategories[0]?.id) ?? "";
  const defaultPayment = resolveDefaultPayment(user, paymentOptions, cards, paymentChoices);

  useEffect(() => {
    if (!open) return;
    reset(
      expense
        ? {
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            categoryId: expense.categoryId,
            payment: encodePaymentValue({
              paymentMethod: expense.paymentMethod,
              paymentCardId: expense.paymentCardId,
              paymentOptionId: expense.paymentOptionId,
            }),
            status: expense.status,
            notes: expense.notes ?? "",
            recurrence: expense.recurrence,
            recurrenceCount: String(expense.recurrenceCount ?? 1),
          }
        : {
            ...emptyValues,
            date: defaultDate ?? todayISO(),
            categoryId: defaultCategoryId,
            payment: defaultPayment,
          },
    );
    const timer = setTimeout(() => descriptionRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, expense, defaultDate, reset, defaultCategoryId, defaultPayment]);

  const status = watch("status");
  const recurrence = watch("recurrence");

  const onSubmit = handleSubmit(async (values) => {
    const decoded = decodePaymentValue(values.payment);
    const card = decoded.paymentCardId
      ? cards.find((c) => c.id === decoded.paymentCardId)
      : undefined;
    const option = decoded.paymentOptionId
      ? paymentOptions.find((o) => o.id === decoded.paymentOptionId)
      : undefined;
    const payload: ExpenseInput = {
      description: values.description.trim(),
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId,
      paymentMethod: card?.kind ?? option?.method ?? decoded.paymentMethod,
      paymentCardId: card?.id,
      paymentOptionId: card ? undefined : option?.id,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      recurrence: values.recurrence,
      recurrenceCount: values.recurrence === "none" ? 1 : Number(values.recurrenceCount) || 0,
    };

    try {
      if (expense) {
        await updateExpense(expense.id, payload);
        toast("Movimentação atualizada.", {
          description: `${payload.description} foi salvo.`,
        });
        onClose();
        return;
      }
      await addExpense(payload);
      const times = payload.recurrence !== "none" ? payload.recurrenceCount ?? 1 : 1;
      toast(
        times === 0
          ? "Gasto recorrente criado."
          : times > 1
            ? `${times} lançamentos criados.`
            : "Gasto adicionado com sucesso.",
        {
          description:
            times === 0
              ? `${payload.description} se repetirá sempre.`
              : times > 1
                ? `${payload.description} será repetido ${times} vezes.`
                : `${payload.description} lançado.`,
        },
      );
      maybeWarnSpendCap(transactions, user?.monthlySpendCap, payload.date, payload.amount, toast);
      if (keepOpen.current) {
        reset({
          ...emptyValues,
          date: values.date,
          categoryId: values.categoryId,
          payment: values.payment,
        });
        descriptionRef.current?.focus();
      } else {
        onClose();
      }
    } catch {
      toast("Não foi possível salvar o gasto.", { variant: "error" });
    } finally {
      keepOpen.current = false;
    }
  });

  const { ref: descRegisterRef, ...descriptionField } = register("description");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? "Editar gasto" : "Novo gasto"}
      description={
        expense
          ? "Atualize as informações do lançamento."
          : "Registre um gasto em poucos segundos."
      }
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          {!expense && (
            <Button
              type="button"
              variant="outline"
              icon={<Plus className="h-4 w-4" />}
              loading={isSubmitting && keepOpen.current}
              onClick={() => {
                keepOpen.current = true;
                void onSubmit();
              }}
            >
              Salvar e adicionar outro
            </Button>
          )}
          <Button
            type="submit"
            form="expense-form"
            loading={isSubmitting && !keepOpen.current}
            icon={<Check className="h-4 w-4" />}
          >
            {expense ? "Salvar alterações" : "Salvar gasto"}
          </Button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={onSubmit} className="space-y-4 px-5 py-5">
        <Input
          id="description"
          label="Descrição"
          placeholder="Ex.: Mercado, combustível, aluguel..."
          autoComplete="off"
          error={errors.description?.message}
          {...descriptionField}
          ref={(el) => {
            descRegisterRef(el);
            descriptionRef.current = el;
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput
                id="amount"
                label="Valor"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.amount?.message}
              />
            )}
          />
          <DatePicker
            id="date"
            label="Data"
            error={errors.date?.message}
            {...register("date")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="categoryId"
            label="Categoria"
            options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId?.message}
            {...register("categoryId")}
          />
          <Select
            id="payment"
            label="Forma de pagamento"
            options={paymentChoices}
            error={errors.payment?.message}
            {...register("payment")}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-foreground-secondary">Status</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "paid", label: "Pago", tone: "success" },
                { value: "pending", label: "Pendente", tone: "warning" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("status", opt.value, { shouldDirty: true })}
                className={cn(
                  "rounded-xl border px-3 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  status === opt.value
                    ? opt.tone === "success"
                      ? "border-success/40 bg-success-subtle text-success"
                      : "border-warning/40 bg-warning-subtle text-warning"
                    : "border-border bg-surface text-foreground-secondary hover:border-foreground-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("grid gap-4", recurrence !== "none" && !expense && "sm:grid-cols-2")}>
          <Select
            id="recurrence"
            label="Recorrência"
            options={RECURRENCE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            {...register("recurrence")}
          />
          {recurrence !== "none" && !expense && (
            <Select
              id="recurrenceCount"
              label="Parcelas"
              options={RECURRENCE_COUNTS}
              {...register("recurrenceCount")}
            />
          )}
        </div>

        <Textarea
          id="notes"
          label="Observação (opcional)"
          placeholder="Detalhes sobre esse gasto..."
          error={errors.notes?.message}
          {...register("notes")}
        />
      </form>
    </Modal>
  );
}

function resolveDefaultPayment(
  user: { defaultPaymentCardId?: string | null; defaultPaymentOptionId?: string | null } | null | undefined,
  paymentOptions: { id: string }[],
  cards: { id: string }[],
  paymentChoices: { value: string }[],
): string {
  if (user?.defaultPaymentCardId && cards.some((c) => c.id === user.defaultPaymentCardId)) {
    return `card:${user.defaultPaymentCardId}`;
  }
  if (user?.defaultPaymentOptionId && paymentOptions.some((o) => o.id === user.defaultPaymentOptionId)) {
    return `opt:${user.defaultPaymentOptionId}`;
  }
  return paymentChoices[0]?.value ?? "pix";
}

function maybeWarnSpendCap(
  transactions: Parameters<typeof monthlyExpenseTotal>[0],
  cap: number | null | undefined,
  date: string,
  amount: number,
  toast: (title: string, options?: { description?: string; variant?: "success" | "error" | "info" }) => void,
) {
  if (!cap || cap <= 0) return;
  const month = buildPeriod("month");
  const extra = isInPeriod(date, month) ? amount : 0;
  if (!extra) return;
  const before = monthlyExpenseTotal(transactions);
  const after = before + extra;
  const prev = spendCapLevel(before, cap);
  const next = spendCapLevel(after, cap);
  if (next === "ok" || next === prev) return;
  const message = spendCapMessage(after, cap, next);
  toast(message.title, { description: message.description, variant: "info" });
}
