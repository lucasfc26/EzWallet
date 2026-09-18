import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { formatCents } from "../../lib/money";

type Tone = "neutral" | "green" | "red" | "amber" | "violet";

const toneStyles: Record<Tone, { chip: string; value: string }> = {
  neutral: { chip: "bg-slate-100 text-slate-600", value: "text-slate-900" },
  green: { chip: "bg-emerald-50 text-emerald-600", value: "text-emerald-600" },
  red: { chip: "bg-rose-50 text-rose-600", value: "text-rose-600" },
  amber: { chip: "bg-amber-50 text-amber-600", value: "text-amber-600" },
  violet: { chip: "bg-violet-50 text-violet-600", value: "text-violet-600" },
};

export function SummaryCard({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
  className,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: Tone;
  hint?: string;
  className?: string;
  highlight?: boolean;
}) {
  const styles = toneStyles[tone];
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-shadow hover:shadow-sm",
        highlight
          ? "border-slate-900/10 bg-slate-900 text-white"
          : "border-slate-200/80 bg-white",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[12px] font-medium",
            highlight ? "text-slate-300" : "text-slate-500",
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            highlight ? "bg-white/10 text-white" : styles.chip,
          )}
        >
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-2.5 text-xl font-semibold tabular-nums tracking-tight",
          highlight ? "text-white" : styles.value,
        )}
      >
        {formatCents(value)}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-[11.5px]",
            highlight ? "text-slate-400" : "text-slate-400",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
