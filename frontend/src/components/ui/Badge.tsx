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
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
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
