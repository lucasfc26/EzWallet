import { forwardRef, useEffect, useState, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { centsToMaskedInput, parseCurrencyToCents } from "../../lib/money";
import { FieldWrapper } from "./Field";

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  hint?: string;
  /** value in cents */
  value: number;
  onChange: (cents: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { label, error, hint, value, onChange, className, id, ...props },
    ref,
  ) {
    const [display, setDisplay] = useState(() =>
      value ? centsToMaskedInput(value) : "",
    );

    useEffect(() => {
      const parsed = parseCurrencyToCents(display);
      if (parsed !== value) {
        setDisplay(value ? centsToMaskedInput(value) : "");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={id}>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
            R$
          </span>
          <input
            ref={ref}
            id={id}
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
            value={display}
            onChange={(e) => {
              const cents = parseCurrencyToCents(e.target.value);
              setDisplay(cents ? centsToMaskedInput(cents) : "");
              onChange(cents);
            }}
            className={cn(
              "h-11 w-full rounded-xl border bg-white pl-10 pr-3 text-base font-semibold text-slate-900 tabular-nums",
              "placeholder:font-normal placeholder:text-slate-300",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400",
              error ? "border-rose-300 focus:ring-rose-500/40" : "border-slate-200",
              className,
            )}
            {...props}
          />
        </div>
      </FieldWrapper>
    );
  },
);
