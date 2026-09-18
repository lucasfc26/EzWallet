import { Badge, type BadgeTone } from "../ui/Badge";
import type { Charge, Transaction } from "../../types";
import { isChargeOverdue } from "../../lib/selectors";

export function TransactionStatusBadge({ transaction }: { transaction: Transaction }) {
  if (transaction.type === "expense") {
    return transaction.status === "paid" ? (
      <Badge tone="green">Pago</Badge>
    ) : (
      <Badge tone="amber">Pendente</Badge>
    );
  }
  return transaction.status === "received" ? (
    <Badge tone="green">Recebido</Badge>
  ) : (
    <Badge tone="amber">A receber</Badge>
  );
}

const CHARGE_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Pendente", tone: "amber" },
  overdue: { label: "Vencida", tone: "red" },
  received: { label: "Recebida", tone: "green" },
  canceled: { label: "Cancelada", tone: "slate" },
};

export function chargeStatusKey(charge: Charge): string {
  if (charge.status === "pending" && isChargeOverdue(charge)) return "overdue";
  return charge.status;
}

export function ChargeStatusBadge({ charge }: { charge: Charge }) {
  const key = chargeStatusKey(charge);
  const cfg = CHARGE_LABEL[key];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
