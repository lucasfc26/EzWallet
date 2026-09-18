import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToast } from "../../hooks/useToast";

const icons = {
  success: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />,
  error: <XCircle className="h-4.5 w-4.5 text-rose-600" />,
  info: <Info className="h-4.5 w-4.5 text-indigo-600" />,
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/5 animate-[slideUp_.2s_ease-out]"
        >
          <span className="mt-0.5">{icons[t.variant]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-[13px] text-slate-500">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Fechar aviso"
            className="rounded p-0.5 text-slate-400 transition-colors hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
