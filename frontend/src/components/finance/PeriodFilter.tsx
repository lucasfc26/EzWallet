import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Period, PeriodPreset } from "../../types";
import { buildPeriod, periodLabel, shiftPeriod } from "../../lib/dates";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Personalizado" },
];

export function PeriodFilter({
  period,
  onChange,
  presets = PRESETS.map((p) => p.value),
  className,
}: {
  period: Period;
  onChange: (period: Period) => void;
  presets?: PeriodPreset[];
  className?: string;
}) {
  const [customOpen, setCustomOpen] = useState(period.preset === "custom");

  const handlePreset = (preset: PeriodPreset) => {
    if (preset === "custom") {
      setCustomOpen(true);
      onChange({ ...period, preset: "custom" });
      return;
    }
    setCustomOpen(false);
    onChange(buildPeriod(preset));
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {PRESETS.filter((p) => presets.includes(p.value)).map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12.5px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                period.preset === p.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {period.preset !== "custom" && (
          <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Período anterior"
              className="h-7 w-7"
              onClick={() => onChange(shiftPeriod(period, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[110px] px-1 text-center text-[12.5px] font-medium text-slate-700">
              {periodLabel(period)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Próximo período"
              className="h-7 w-7"
              onClick={() => onChange(shiftPeriod(period, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {(customOpen || period.preset === "custom") && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={period.from}
            max={period.to}
            onChange={(e) =>
              onChange({ preset: "custom", from: e.target.value, to: period.to })
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-[12.5px] text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
          <span className="text-[12.5px] text-slate-400">até</span>
          <input
            type="date"
            value={period.to}
            min={period.from}
            onChange={(e) =>
              onChange({ preset: "custom", from: period.from, to: e.target.value })
            }
            className="rounded-lg border border-slate-200 px-2 py-1 text-[12.5px] text-slate-700 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      )}
    </div>
  );
}
