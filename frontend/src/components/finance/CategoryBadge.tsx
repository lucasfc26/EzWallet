import {
  Briefcase,
  Car,
  CircleDashed,
  CirclePlus,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Laptop,
  PartyPopper,
  Repeat,
  ShoppingBag,
  TrendingUp,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "../../data/categories";
import { cn } from "../../utils/cn";

const ICONS: Record<string, LucideIcon> = {
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
  const category = getCategory(categoryId);
  const Icon = ICONS[category.icon] ?? CircleDashed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        size === "sm" ? "h-8 w-8" : "h-10 w-10",
        category.tone,
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    </span>
  );
}

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const category = getCategory(categoryId);
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-600">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
