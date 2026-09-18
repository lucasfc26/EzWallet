import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea, DatePicker } from "../ui/Field";
import { CurrencyInput } from "../ui/CurrencyInput";
import { RECURRENCE_COUNTS, RECURRENCE_OPTIONS } from "../../data/categories";
import { cn } from "../../utils/cn";
import { todayISO } from "../../lib/dates";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import type { Income, IncomeInput } from "../../types";

const schema = z.object({
  description: z.string().trim().min(2, "Informe uma descrição"),
  amount: z.number().int().positive("Informe um valor maior que zero"),
  date: z.string().min(1, "Selecione a data"),
  categoryId: z.string().min(1, "Selecione a origem"),
  status: z.enum(["received", "pending"]),
  notes: z.string().max(240).optional(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
  recurrenceCount: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  description: "",
  amount: 0,
  date: todayISO(),
  categoryId: "",
  status: "received",
  notes: "",
  recurrence: "none",
  recurrenceCount: "1",
};

export function IncomeFormModal({
  open,
  onClose,
  income,
}: {
  open: boolean;
  onClose: () => void;
  income?: Income | null;
}) {
  const { addIncome, updateIncome, categories } = useFinance();
  const { toast } = useToast();
  const descriptionRef = useRef<HTMLInputElement | null>(null);
  const incomeCategories = categories.filter((c) => c.kind === "income" && c.slug !== "cobrancas");
  const defaultCategoryId = incomeCategories[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });
  const recurrence = watch("recurrence");

  useEffect(() => {
    if (!open) return;
    reset(
      income
        ? {
            description: income.description,
            amount: income.amount,
            date: income.date,
            categoryId: income.categoryId,
            status: income.status,
            notes: income.notes ?? "",
            recurrence: income.recurrence,
            recurrenceCount: String(income.recurrenceCount ?? 1),
          }
        : { ...emptyValues, categoryId: defaultCategoryId },
    );
    const timer = setTimeout(() => descriptionRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, income, reset, defaultCategoryId]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: IncomeInput = {
      description: values.description.trim(),
      amount: values.amount,
      date: values.date,
      categoryId: values.categoryId,
      status: values.status,
      notes: values.notes?.trim() || undefined,
      recurrence: values.recurrence,
      recurrenceCount: values.recurrence === "none" ? 1 : Number(values.recurrenceCount) || 0,
    };
    try {
      if (income) {
        await updateIncome(income.id, payload);
        toast("Movimentação atualizada.");
      } else {
        await addIncome(payload);
        const times = payload.recurrence !== "none" ? payload.recurrenceCount ?? 1 : 1;
        toast(
          times === 0
            ? "Receita recorrente criada."
            : times > 1
              ? `${times} receitas criadas.`
              : "Receita registrada com sucesso.",
        );
      }
      onClose();
    } catch {
      toast("Não foi possível salvar a receita.", { variant: "error" });
    }
  });

  const { ref: descRegisterRef, ...descriptionField } = register("description");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={income ? "Editar receita" : "Nova receita"}
      description="Entradas de dinheiro já recebidas ou previstas."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="income-form"
            variant="success"
            loading={isSubmitting}
            icon={<Check className="h-4 w-4" />}
          >
            {income ? "Salvar alterações" : "Salvar receita"}
          </Button>
        </div>
      }
    >
      <form id="income-form" onSubmit={onSubmit} className="space-y-4 px-5 py-5">
        <Input
          id="income-description"
          label="Descrição"
          placeholder="Ex.: Salário, freelance, venda..."
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
                id="income-amount"
                label="Valor"
                value={field.value}
                onChange={field.onChange}
                error={errors.amount?.message}
              />
            )}
          />
          <DatePicker
            id="income-date"
            label="Data"
            error={errors.date?.message}
            {...register("date")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="income-category"
            label="Origem"
            options={incomeCategories.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
            error={errors.categoryId?.message}
            {...register("categoryId")}
          />
          <Select
            id="income-status"
            label="Status"
            options={[
              { value: "received", label: "Recebida" },
              { value: "pending", label: "A receber" },
            ]}
            {...register("status")}
          />
        </div>
        <div className={cn("grid gap-4", recurrence !== "none" && !income && "sm:grid-cols-2")}>
          <Select
            id="income-recurrence"
            label="Recorrência"
            options={RECURRENCE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            {...register("recurrence")}
          />
          {recurrence !== "none" && !income && (
            <Select
              id="income-recurrence-count"
              label="Parcelas"
              options={RECURRENCE_COUNTS}
              {...register("recurrenceCount")}
            />
          )}
        </div>
        <Textarea
          id="income-notes"
          label="Observação (opcional)"
          {...register("notes")}
        />
      </form>
    </Modal>
  );
}
