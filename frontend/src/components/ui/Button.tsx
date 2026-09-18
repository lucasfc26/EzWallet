import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-600/20",
  secondary:
    "bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2",
        "disabled:opacity-55 disabled:pointer-events-none select-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
});
