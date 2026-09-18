import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { formatCents } from "../../lib/money";

type Tone = "neutral" | "green" | "red" | "amber" | "violet";

const toneStyles: Record<Tone, { chip: string; value: string }> = {
  neutral: { chip: "bg-surface-secondary text-foreground-secondary", value: "text-foreground" },
  green: { chip: "bg-success-subtle text-success", value: "text-success" },
  red: { chip: "bg-danger-subtle text-danger", value: "text-danger" },
  amber: { chip: "bg-warning-subtle text-warning", value: "text-warning" },
  violet: { chip: "bg-accent/10 text-accent", value: "text-accent" },
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
          ? "border-primary/20 bg-primary text-white"
          : "border-border bg-surface",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[12px] font-medium",
            highlight ? "text-white/70" : "text-foreground-secondary",
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
            highlight ? "text-white/60" : "text-foreground-muted",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
