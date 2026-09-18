import type {
  CardBrand,
  CardKind,
  Category,
  PaymentCard,
  PaymentMethod,
  PaymentMethodId,
  PaymentOption,
} from "../types";

export const FALLBACK_CATEGORY: Category = {
  id: "outros",
  name: "Outros",
  kind: "expense",
  icon: "circle-dashed",
  color: "#64748b",
};

export function getCategory(id: string, categories: Category[] = []): Category {
  return categories.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pix", label: "Pix" },
  { id: "debit", label: "Cartão de débito" },
  { id: "credit", label: "Cartão de crédito" },
  { id: "cash", label: "Dinheiro" },
  { id: "boleto", label: "Boleto" },
  { id: "transfer", label: "Transferência" },
];

const PAYMENT_MAP = new Map(PAYMENT_METHODS.map((p) => [p.id, p]));

export function getPaymentMethod(id: PaymentMethodId): PaymentMethod {
  return PAYMENT_MAP.get(id) ?? PAYMENT_METHODS[0];
}

export const CARD_BRANDS: { id: CardBrand; label: string }[] = [
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "elo", label: "Elo" },
  { id: "amex", label: "American Express" },
  { id: "hipercard", label: "Hipercard" },
  { id: "other", label: "Outra" },
];

export const CARD_KINDS: { id: CardKind; label: string }[] = [
  { id: "credit", label: "Crédito" },
  { id: "debit", label: "Débito" },
];

export function cardBrandLabel(brand: CardBrand): string {
  return CARD_BRANDS.find((b) => b.id === brand)?.label ?? brand;
}

export function formatCardLabel(card: PaymentCard): string {
  const kind = card.kind === "debit" ? "débito" : "crédito";
  return `${cardBrandLabel(card.brand)} ${kind} •••• ${card.last4}`;
}

export function paymentLabel(
  paymentMethod: PaymentMethodId,
  paymentCardId: string | undefined,
  cards: PaymentCard[],
  paymentOptionId?: string,
  paymentOptions: PaymentOption[] = [],
): string {
  if (paymentCardId) {
    const card = cards.find((c) => c.id === paymentCardId);
    if (card) return formatCardLabel(card);
  }
  if (paymentOptionId) {
    const option = paymentOptions.find((o) => o.id === paymentOptionId);
    if (option) return option.name;
  }
  const byMethod = paymentOptions.find((o) => o.method === paymentMethod);
  if (byMethod) return byMethod.name;
  return getPaymentMethod(paymentMethod).label;
}

export function paymentSelectOptions(paymentOptions: PaymentOption[], cards: PaymentCard[]) {
  const optionItems = paymentOptions.map((o) => ({ value: `opt:${o.id}`, label: o.name }));
  const cardItems = cards.map((c) => ({ value: `card:${c.id}`, label: formatCardLabel(c) }));
  if (optionItems.length === 0 && cardItems.length === 0) {
    return PAYMENT_METHODS.map((p) => ({ value: p.id, label: p.label }));
  }
  return [...optionItems, ...cardItems];
}

export function encodePaymentValue(args: {
  paymentMethod: PaymentMethodId;
  paymentCardId?: string;
  paymentOptionId?: string;
}): string {
  if (args.paymentCardId) return `card:${args.paymentCardId}`;
  if (args.paymentOptionId) return `opt:${args.paymentOptionId}`;
  return args.paymentMethod;
}

export function decodePaymentValue(value: string): {
  paymentMethod: PaymentMethodId;
  paymentCardId?: string;
  paymentOptionId?: string;
} {
  if (value.startsWith("card:")) {
    return { paymentMethod: "credit", paymentCardId: value.slice(5) };
  }
  if (value.startsWith("opt:")) {
    return { paymentMethod: "pix", paymentOptionId: value.slice(4) };
  }
  return { paymentMethod: value as PaymentMethodId };
}

export const RECURRENCE_OPTIONS = [
  { value: "none", label: "Não se repete" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
] as const;

export const RECURRENCE_LABEL: Record<string, string> = {
  none: "Única",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export const RECURRENCE_COUNTS = Array.from({ length: 60 }, (_, i) => {
  const n = i + 1;
  return { value: String(n), label: `${n}x` };
});

export const CATEGORY_ICONS = [
  "utensils",
  "car",
  "home",
  "heart-pulse",
  "graduation-cap",
  "party-popper",
  "shopping-bag",
  "repeat",
  "circle-dashed",
  "briefcase",
  "laptop",
  "hand-coins",
  "trending-up",
  "circle-plus",
  "coffee",
  "fuel",
  "gift",
  "plane",
  "dumbbell",
  "smartphone",
  "wifi",
  "zap",
  "paw-print",
  "baby",
  "shirt",
  "music",
] as const;

export const CATEGORY_COLORS = [
  "#f97316",
  "#0ea5e9",
  "#8b5cf6",
  "#f43f5e",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#64748b",
  "#10b981",
  "#059669",
  "#34d399",
  "#22c55e",
  "#e11d48",
  "#d946ef",
  "#06b6d4",
];
