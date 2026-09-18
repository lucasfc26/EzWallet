import { useId } from "react";
import { cn } from "../utils/cn";

type Size = "sm" | "md" | "lg";

const MARK: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

const WORD: Record<Size, string> = {
  sm: "text-sm",
  md: "text-[15px]",
  lg: "text-lg",
};

/** Rounded mark: fanned card + billfold + gold coin clasp. */
export function BrandMark({
  className,
  title = "EzWallet",
}: {
  className?: string;
  title?: string;
}) {
  const uid = useId();
  const bg = `${uid}-bg`;
  const sheen = `${uid}-sheen`;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={bg} x1="6" y1="0" x2="34" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5CE1EA" />
          <stop offset="0.48" stopColor="#159EAD" />
          <stop offset="1" stopColor="#0B3E4B" />
        </linearGradient>
        <linearGradient id={sheen} x1="20" y1="0" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="40" height="40" rx="11" fill={`url(#${bg})`} />
      <rect width="40" height="40" rx="11" fill={`url(#${sheen})`} />

      {/* Card tucked behind the wallet */}
      <rect
        x="13"
        y="8.2"
        width="18.5"
        height="13"
        rx="2.6"
        fill="white"
        fillOpacity="0.36"
        transform="rotate(-16 22.25 14.7)"
      />

      {/* Billfold */}
      <rect x="8.5" y="15.4" width="23" height="16.2" rx="3.2" fill="white" />
      <rect x="8.5" y="15.4" width="23" height="5.4" rx="3.2" fill="#EAF6F8" />
      <rect x="8.5" y="18.2" width="23" height="2.6" fill="#EAF6F8" />
      <rect x="8.5" y="20.35" width="23" height="1.7" fill="#9AD9E0" />

      {/* Coin clasp */}
      <circle cx="26.7" cy="26.9" r="4.05" fill="#F5C84B" />
      <circle
        cx="26.7"
        cy="26.9"
        r="2.55"
        fill="none"
        stroke="#C9951E"
        strokeWidth="1.15"
      />
      <path
        d="M25.15 25.45a1.35 1.35 0 0 1 1.7-.2"
        stroke="#FEF3C7"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  layout = "row",
  subtitle,
  className,
}: {
  size?: Size;
  layout?: "row" | "stack";
  subtitle?: string;
  className?: string;
}) {
  const stacked = layout === "stack";

  return (
    <div
      className={cn(
        "flex items-center",
        stacked ? "flex-col gap-2 text-center" : "gap-2.5",
        className,
      )}
    >
      <BrandMark className={MARK[size]} />
      <div className={stacked ? "flex flex-col items-center" : undefined}>
        <p
          className={cn(
            "font-semibold leading-tight tracking-tight text-foreground",
            WORD[size],
          )}
        >
          EzWallet
        </p>
        {subtitle && (
          <p className={cn("text-foreground-muted", stacked ? "text-sm" : "text-[11.5px]")}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
