import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Copy,
  HandCoins,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { PageHeader } from "../../components/finance/PageHeader";
import { PeriodFilter } from "../../components/finance/PeriodFilter";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Tabs } from "../../components/ui/Tabs";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SummaryCard } from "../../components/finance/SummaryCard";
import { ChargeStatusBadge, chargeStatusKey } from "../../components/finance/StatusBadge";
import { ChargeFormModal } from "../../components/finance/ChargeFormModal";
import { useFinance } from "../../hooks/useFinance";
import { useToast } from "../../hooks/useToast";
import { buildPeriod, dueLabel, formatBR, isInPeriod } from "../../lib/dates";
import { formatCents, sum } from "../../lib/money";
import { isChargeOverdue } from "../../lib/selectors";
import { RECURRENCE_LABEL } from "../../data/categories";
import type { Charge, Period } from "../../types";

type Filter = "all" | "pending" | "overdue" | "received" | "canceled";

export default function ChargesPage() {
  const { charges, loading, settleCharge, removeCharge, cancelCharge, duplicateCharge } =
    useFinance();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>(() => buildPeriod("month"));
  const [filter, setFilter] = useState<Filter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Charge | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const pending = charges.filter((c) => c.status === "pending");
  const overdue = pending.filter(isChargeOverdue);
  const receivedInPeriod = charges.filter(
    (c) => c.status === "received" && c.receivedAt && isInPeriod(c.receivedAt, period),
  );

  const filtered = useMemo(() => {
    const list =
      filter === "all"
        ? charges
        : charges.filter((c) => chargeStatusKey(c) === filter);
    return [...list].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, [charges, filter]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSettle = async (charge: Charge) => {
    await settleCharge(charge.id);
    toast("Cobrança recebida.", {
      description: `${formatCents(charge.amount)} de ${charge.clientName} entraram como receita.`,
    });
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    await removeCharge(confirmId);
    setConfirmId(null);
    toast("Cobrança excluída.", { variant: "info" });
  };

  const copySummary = async (charge: Charge) => {
    const text = `Cobrança — ${charge.description}\nCliente: ${charge.clientName}\nValor: ${formatCents(
      charge.amount,
    )}\nVencimento: ${formatBR(charge.dueDate)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Resumo copiado para a área de transferência.", { variant: "info" });
    } catch {
      toast("Não foi possível copiar o resumo.", { variant: "error" });
    }
  };

  const menuFor = (charge: Charge) => [
    {
      label: "Marcar como recebida",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      hidden: charge.status !== "pending",
      onSelect: () => void handleSettle(charge),
    },
    {
      label: "Editar cobrança",
      icon: <Pencil className="h-3.5 w-3.5" />,
      onSelect: () => {
        setEditing(charge);
        setFormOpen(true);
      },
    },
    {
      label: "Duplicar",
      icon: <Copy className="h-3.5 w-3.5" />,
      onSelect: async () => {
        await duplicateCharge(charge.id);
        toast("Cobrança duplicada.");
      },
    },
    {
      label: "Copiar resumo",
      icon: <ClipboardCopy className="h-3.5 w-3.5" />,
      onSelect: () => void copySummary(charge),
    },
    {
      label: "Cancelar cobrança",
      icon: <Ban className="h-3.5 w-3.5" />,
      hidden: charge.status !== "pending",
      onSelect: async () => {
        await cancelCharge(charge.id);
        toast("Cobrança cancelada.", { variant: "info" });
      },
    },
    {
      label: "Excluir",
      icon: <Trash2 className="h-3.5 w-3.5" />,
      destructive: true,
      onSelect: () => setConfirmId(charge.id),
    },
  ];

  return (
    <>
      <PageHeader
        title="Cobranças"
        subtitle="Controle o que você tem a receber de clientes e pessoas."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Nova cobrança
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Total a receber"
          value={sum(pending.map((c) => c.amount))}
          icon={<Wallet className="h-3.5 w-3.5" />}
          tone="violet"
          hint={`${pending.length} cobrança(s) em aberto`}
        />
        <SummaryCard
          label="Pendentes"
          value={sum(pending.filter((c) => !isChargeOverdue(c)).map((c) => c.amount))}
          icon={<Clock className="h-3.5 w-3.5" />}
          tone="amber"
          hint="Dentro do prazo"
        />
        <SummaryCard
          label="Vencidas"
          value={sum(overdue.map((c) => c.amount))}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          tone="red"
          hint={`${overdue.length} em atraso`}
        />
        <SummaryCard
          label="Recebidas no período"
          value={sum(receivedInPeriod.map((c) => c.amount))}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          tone="green"
          hint={`${receivedInPeriod.length} cobrança(s)`}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { value: "all", label: "Todas", count: charges.length },
            {
              value: "pending",
              label: "Pendentes",
              count: pending.filter((c) => !isChargeOverdue(c)).length,
            },
            { value: "overdue", label: "Vencidas", count: overdue.length },
            {
              value: "received",
              label: "Recebidas",
              count: charges.filter((c) => c.status === "received").length,
            },
            {
              value: "canceled",
              label: "Canceladas",
              count: charges.filter((c) => c.status === "canceled").length,
            },
          ]}
        />
        <PeriodFilter
          period={period}
          onChange={setPeriod}
          presets={["month", "year", "custom"]}
        />
      </div>

      <Card>
        {loading ? (
          <LoadingState label="Carregando cobranças..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<HandCoins className="h-5 w-5" />}
            title="Nenhuma cobrança por aqui"
            description="Registre valores que você precisa receber, sem burocracia."
            action={
              <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openNew}>
                Nova cobrança
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((charge) => (
              <li
                key={charge.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-medium text-slate-900">
                      {charge.clientName}
                    </p>
                    <ChargeStatusBadge charge={charge} />
                    {charge.recurrence !== "none" && (
                      <span className="text-[11px] text-slate-400">
                        {RECURRENCE_LABEL[charge.recurrence]}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                    {charge.description}
                  </p>
                  <p className="mt-1 text-[11.5px] text-slate-400">
                    Vence em {formatBR(charge.dueDate)}
                    {charge.status === "pending" && ` • ${dueLabel(charge.dueDate)}`}
                    {charge.status === "received" &&
                      charge.receivedAt &&
                      ` • recebida em ${formatBR(charge.receivedAt)}`}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-[15px] font-semibold tabular-nums text-slate-900">
                    {formatCents(charge.amount)}
                  </span>
                  {charge.status === "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onClick={() => void handleSettle(charge)}
                    >
                      Recebida
                    </Button>
                  )}
                  <DropdownMenu items={menuFor(charge)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ChargeFormModal
        open={formOpen}
        charge={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={confirmId !== null}
        title="Excluir cobrança"
        message="A cobrança será removida permanentemente. As receitas já recebidas continuam no histórico."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  );
}
