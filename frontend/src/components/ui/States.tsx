import type { ReactNode } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-[13px] text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}
