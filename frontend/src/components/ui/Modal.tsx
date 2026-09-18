import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * Responsive dialog: centered modal on desktop, bottom drawer on mobile.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] animate-[fadeIn_.15s_ease-out]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl shadow-slate-900/10",
          "sm:rounded-2xl animate-[slideUp_.2s_ease-out]",
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
