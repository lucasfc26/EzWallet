import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const base =
  "w-full rounded-xl border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:bg-surface-secondary";

export function FieldWrapper({
  label,
  error,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[13px] font-medium text-foreground-secondary"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[12px] font-medium text-danger">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-foreground-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, prefix, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={id}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            base,
            "h-10",
            prefix && "pl-10",
            error ? "border-danger/50 focus:ring-danger/40" : "border-border",
            className,
          )}
          {...props}
        />
      </div>
    </FieldWrapper>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, id, options, ...props },
  ref,
) {
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={id}>
      <select
        ref={ref}
        id={id}
        className={cn(
          base,
          "h-10 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%238a9aa0%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9",
          error ? "border-danger/50 focus:ring-danger/40" : "border-border",
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className, id, ...props }, ref) {
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={id}>
        <textarea
          ref={ref}
          id={id}
          className={cn(
            base,
            "min-h-[76px] py-2 resize-none",
            error ? "border-danger/50 focus:ring-danger/40" : "border-border",
            className,
          )}
          {...props}
        />
      </FieldWrapper>
    );
  },
);

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker({ label, error, hint, className, id, ...props }, ref) {
    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={id}>
        <input
          ref={ref}
          id={id}
          type="date"
          className={cn(
            base,
            "h-10",
            error ? "border-danger/50 focus:ring-danger/40" : "border-border",
            className,
          )}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
