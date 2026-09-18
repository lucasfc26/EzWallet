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
import type { Charge, ChargeInput } from "../../types";

const schema = z.object({
  clientName: z.string().trim().min(2, "Informe o nome da pessoa ou cliente"),
  description: z.string().trim().min(2, "Descreva o que está sendo cobrado"),
  amount: z.number().int().positive("Informe um valor maior que zero"),
  dueDate: z.string().min(1, "Selecione o vencimento"),
  notes: z.string().max(240).optional(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]),
  recurrenceCount: z.string(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
  clientName: "",
  description: "",
  amount: 0,
  dueDate: todayISO(),
  notes: "",
  recurrence: "none",
  recurrenceCount: "1",
};

export function ChargeFormModal({
  open,
  onClose,
  charge,
}: {
  open: boolean;
  onClose: () => void;
  charge?: Charge | null;
}) {
  const { addCharge, updateCharge } = useFinance();
  const { toast } = useToast();
  const nameRef = useRef<HTMLInputElement | null>(null);

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
      charge
        ? {
            clientName: charge.clientName,
            description: charge.description,
            amount: charge.amount,
            dueDate: charge.dueDate,
            notes: charge.notes ?? "",
            recurrence: charge.recurrence,
            recurrenceCount: String(charge.recurrenceCount ?? 1),
          }
        : emptyValues,
    );
    const timer = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, charge, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const payload: ChargeInput = {
      clientName: values.clientName.trim(),
      description: values.description.trim(),
      amount: values.amount,
      dueDate: values.dueDate,
      notes: values.notes?.trim() || undefined,
      recurrence: values.recurrence,
      recurrenceCount: values.recurrence === "none" ? 1 : Number(values.recurrenceCount) || 0,
    };
    try {
      if (charge) {
        await updateCharge(charge.id, payload);
        toast("Receita atualizada.");
      } else {
        await addCharge(payload);
        const times = payload.recurrence !== "none" ? payload.recurrenceCount ?? 1 : 1;
        toast(
          times === 0
            ? "Receita recorrente criada."
            : times > 1
              ? `${times} receitas criadas.`
              : "Receita criada.",
          {
            description: `${payload.clientName} — ${payload.description}`,
          },
        );
      }
      onClose();
    } catch {
      toast("Não foi possível salvar a receita.", { variant: "error" });
    }
  });

  const { ref: nameRegisterRef, ...nameField } = register("clientName");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={charge ? "Editar receita" : "Nova receita"}
      description="Registre um valor que você tem a receber."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="charge-form"
            loading={isSubmitting}
            icon={<Check className="h-4 w-4" />}
          >
            {charge ? "Salvar alterações" : "Criar receita"}
          </Button>
        </div>
      }
    >
      <form id="charge-form" onSubmit={onSubmit} className="space-y-4 px-5 py-5">
        <Input
          id="clientName"
          label="Pessoa ou cliente"
          placeholder="Ex.: Marina Duarte, Studio Vértice..."
          autoComplete="off"
          error={errors.clientName?.message}
          {...nameField}
          ref={(el) => {
            nameRegisterRef(el);
            nameRef.current = el;
          }}
        />
        <Input
          id="charge-description"
          label="Descrição"
          placeholder="Ex.: Consultoria, empréstimo, serviço..."
          autoComplete="off"
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <CurrencyInput
                id="charge-amount"
                label="Valor"
                value={field.value}
                onChange={field.onChange}
                error={errors.amount?.message}
              />
            )}
          />
          <DatePicker
            id="dueDate"
            label="Vencimento"
            error={errors.dueDate?.message}
            {...register("dueDate")}
          />
        </div>
        <div className={cn("grid gap-4", recurrence !== "none" && !charge && "sm:grid-cols-2")}>
          <Select
            id="charge-recurrence"
            label="Recorrência"
            options={RECURRENCE_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
            {...register("recurrence")}
          />
          {recurrence !== "none" && !charge && (
            <Select
              id="charge-recurrence-count"
              label="Parcelas"
              options={RECURRENCE_COUNTS}
              {...register("recurrenceCount")}
            />
          )}
        </div>
        <Textarea
          id="charge-notes"
          label="Observação (opcional)"
          placeholder="Combinado de pagamento, forma de contato..."
          {...register("notes")}
        />
      </form>
    </Modal>
  );
}
