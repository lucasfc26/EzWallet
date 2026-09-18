import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3 px-5 py-5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            destructive ? "bg-danger-subtle text-danger" : "bg-primary/10 text-primary"
          }`}
        >
          <AlertTriangle className="h-4.5 w-4.5" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-foreground-secondary">{message}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-surface-secondary/60 px-5 py-3.5">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
