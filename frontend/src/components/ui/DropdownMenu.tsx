import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "../../utils/cn";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

export function DropdownMenu({
  items,
  align = "right",
  trigger,
  label = "Ações",
}: {
  items: MenuItem[];
  align?: "left" | "right";
  trigger?: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter((i) => !i.hidden);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors",
          "hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
          open && "bg-slate-100 text-slate-700",
        )}
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium transition-colors",
                item.destructive
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
