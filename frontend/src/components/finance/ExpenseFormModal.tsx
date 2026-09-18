import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Plus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea, DatePicker } from "../ui/Field";
import { CurrencyInput } from "../ui/CurrencyInput";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, RECURRENCE_OPTIONS } from "../../data/categories";
import { todayISO } from "../../lib/dates";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import type { Expense, ExpenseInput, PaymentMethodId } from "../../types";
import { cn } from "../../utils/cn";

const schema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Informe uma descrição com pelo menos 2 caracteres"),
  amount: z.number().int().positive("Informe um valor maior que zero"),
  date: z.string().min(1, "Selecione a data"),
  categoryId: z.string().min(1, "Selecione a categoria"),
  paymentMethod: z.string().min(1, "Selecione a forma de pagamento"),
  status: z.enum(["paid", "pending"]),
  notes: z.string().max(240, "Máximo de 240 caracteres").optional(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  description: "",
  amount: 0,
  date: todayISO(),
  categoryId: "alimentacao",
  paymentMethod: "pix",
  status: "paid",
  notes: "",
  recurrence: "none",
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
  const { addExpense, updateExpense } = useFinance();
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

  useEffect(() => {
    if (!open) return;
    reset(
      expense
        ? {
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            categoryId: expense.categoryId,
            paymentMethod: expense.paymentMethod,
            status: expense.status,
            notes: expense.notes ?? "",
            recurrence: expense.recurrence,
          }
        : { ...emptyValues, date: defaultDate ?? todayISO() },
    );
    const timer = setTimeout(() => descriptionRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, expense, defaultDate, reset]);

  const status = watch("status");

  const onSubmit = handleSubmit(async (values) => {
    const payload: ExpenseInput = {
      description: values.description.trim(),
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId,
      paymentMethod: values.paymentMethod as PaymentMethodId,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      recurrence: values.recurrence,
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
      toast("Gasto adicionado com sucesso.", {
        description: `${payload.description} lançado.`,
      });
      if (keepOpen.current) {
        reset({ ...emptyValues, date: values.date, categoryId: values.categoryId });
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
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
            error={errors.categoryId?.message}
            {...register("categoryId")}
          />
          <Select
            id="paymentMethod"
            label="Forma de pagamento"
            options={PAYMENT_METHODS.map((p) => ({ value: p.id, label: p.label }))}
            error={errors.paymentMethod?.message}
            {...register("paymentMethod")}
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-[13px] font-medium text-slate-700">Status</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "paid", label: "Pago", tone: "emerald" },
                { value: "pending", label: "Pendente", tone: "amber" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("status", opt.value, { shouldDirty: true })}
                className={cn(
                  "rounded-xl border px-3 py-2 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                  status === opt.value
                    ? opt.tone === "emerald"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                      : "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Select
          id="recurrence"
          label="Recorrência"
          options={RECURRENCE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
          {...register("recurrence")}
        />

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
