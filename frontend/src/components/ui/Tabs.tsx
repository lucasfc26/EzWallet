import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
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
  paged = false,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  /** On small screens, show 3 tabs + an arrow that reveals the rest. */
  paged?: boolean;
}) {
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    const index = items.findIndex((item) => item.value === value);
    if (index >= 0) setPage(Math.floor(index / pageSize));
  }, [value, items]);

  const renderItem = (item: TabItem<T>) => {
    const active = item.value === value;
    return (
      <button
        key={item.value}
        type="button"
        onClick={() => onChange(item.value)}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
          active
            ? "bg-surface text-foreground shadow-sm"
            : "text-foreground-secondary hover:text-foreground",
        )}
      >
        {item.label}
        {typeof item.count === "number" && (
          <span
            className={cn(
              "rounded-full px-1.5 text-[10px] font-semibold",
              active
                ? "bg-surface-secondary text-foreground-secondary"
                : "bg-border/70 text-foreground-secondary",
            )}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);

  return (
    <>
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-xl bg-surface-secondary p-1",
          paged && "hidden md:inline-flex",
          className,
        )}
      >
        {items.map(renderItem)}
      </div>

      {paged && (
        <div
          className={cn(
            "inline-flex max-w-full items-center gap-1 rounded-xl bg-surface-secondary p-1 md:hidden",
            className,
          )}
        >
          {page > 0 && (
            <button
              type="button"
              aria-label="Ver abas anteriores"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {visible.map(renderItem)}
          {page < pageCount - 1 && (
            <button
              type="button"
              aria-label="Ver mais abas"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
