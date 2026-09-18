import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type BadgeTone =
  | "neutral"
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "violet"
  | "slate";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-secondary text-foreground-secondary ring-border",
  slate: "bg-surface-secondary text-foreground-secondary ring-border",
  green: "bg-success-subtle text-success ring-success/20",
  red: "bg-danger-subtle text-danger ring-danger/20",
  amber: "bg-warning-subtle text-warning ring-warning/20",
  blue: "bg-info-subtle text-info ring-info/20",
  violet: "bg-accent/10 text-accent ring-accent/25",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
