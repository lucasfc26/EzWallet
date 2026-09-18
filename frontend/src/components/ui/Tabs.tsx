import { cn } from "../../utils/cn";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
  size = "md",
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
              size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
              active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-slate-100 text-slate-600" : "bg-slate-200/70 text-slate-500",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
