import {
  Baby,
  Briefcase,
  Car,
  CircleDashed,
  CirclePlus,
  Coffee,
  Dumbbell,
  Fuel,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Laptop,
  Music,
  PartyPopper,
  PawPrint,
  Plane,
  Repeat,
  Shirt,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { FALLBACK_CATEGORY } from "../../data/categories";
import { useFinance } from "../../hooks/useFinance";
import { cn } from "../../utils/cn";

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  home: Home,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "party-popper": PartyPopper,
  "shopping-bag": ShoppingBag,
  repeat: Repeat,
  "circle-dashed": CircleDashed,
  briefcase: Briefcase,
  laptop: Laptop,
  "hand-coins": HandCoins,
  "trending-up": TrendingUp,
  "circle-plus": CirclePlus,
  coffee: Coffee,
  fuel: Fuel,
  gift: Gift,
  plane: Plane,
  dumbbell: Dumbbell,
  smartphone: Smartphone,
  wifi: Wifi,
  zap: Zap,
  "paw-print": PawPrint,
  baby: Baby,
  shirt: Shirt,
  music: Music,
};

export function CategoryIcon({
  categoryId,
  size = "md",
  className,
}: {
  categoryId: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { categories } = useFinance();
  const category = categories.find((c) => c.id === categoryId) ?? FALLBACK_CATEGORY;
  const Icon = CATEGORY_ICON_MAP[category.icon] ?? CircleDashed;
  return (
    <span
      className={cn(
        "cat-chip inline-flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        className,
      )}
      style={{ "--cat": category.color } as React.CSSProperties}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const { categories } = useFinance();
  const category = categories.find((c) => c.id === categoryId) ?? FALLBACK_CATEGORY;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground-secondary">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
      {category.name}
    </span>
  );
}
