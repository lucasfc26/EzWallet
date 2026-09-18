import type { Category, PaymentMethod, PaymentMethodId } from "../types";

export const EXPENSE_CATEGORIES: Category[] = [
  {
    id: "alimentacao",
    name: "Alimentação",
    kind: "expense",
    icon: "utensils",
    tone: "bg-orange-50 text-orange-600 ring-orange-100",
    color: "#f97316",
  },
  {
    id: "transporte",
    name: "Transporte",
    kind: "expense",
    icon: "car",
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
    color: "#0ea5e9",
  },
  {
    id: "moradia",
    name: "Moradia",
    kind: "expense",
    icon: "home",
    tone: "bg-violet-50 text-violet-600 ring-violet-100",
    color: "#8b5cf6",
  },
  {
    id: "saude",
    name: "Saúde",
    kind: "expense",
    icon: "heart-pulse",
    tone: "bg-rose-50 text-rose-600 ring-rose-100",
    color: "#f43f5e",
  },
  {
    id: "educacao",
    name: "Educação",
    kind: "expense",
    icon: "graduation-cap",
    tone: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    color: "#6366f1",
  },
  {
    id: "lazer",
    name: "Lazer",
    kind: "expense",
    icon: "party-popper",
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
    color: "#f59e0b",
  },
  {
    id: "compras",
    name: "Compras",
    kind: "expense",
    icon: "shopping-bag",
    tone: "bg-pink-50 text-pink-600 ring-pink-100",
    color: "#ec4899",
  },
  {
    id: "assinaturas",
    name: "Assinaturas",
    kind: "expense",
    icon: "repeat",
    tone: "bg-teal-50 text-teal-600 ring-teal-100",
    color: "#14b8a6",
  },
  {
    id: "outros",
    name: "Outros",
    kind: "expense",
    icon: "circle-dashed",
    tone: "bg-slate-100 text-slate-600 ring-slate-200",
    color: "#64748b",
  },
];

export const INCOME_CATEGORIES: Category[] = [
  {
    id: "salario",
    name: "Salário",
    kind: "income",
    icon: "briefcase",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#10b981",
  },
  {
    id: "freelance",
    name: "Freelance",
    kind: "income",
    icon: "laptop",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#059669",
  },
  {
    id: "cobrancas",
    name: "Cobranças",
    kind: "income",
    icon: "hand-coins",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#34d399",
  },
  {
    id: "investimentos",
    name: "Investimentos",
    kind: "income",
    icon: "trending-up",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#22c55e",
  },
  {
    id: "outras-receitas",
    name: "Outras receitas",
    kind: "income",
    icon: "circle-plus",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    color: "#4ade80",
  },
];

export const ALL_CATEGORIES: Category[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

const CATEGORY_MAP = new Map(ALL_CATEGORIES.map((c) => [c.id, c]));

export const FALLBACK_CATEGORY: Category = {
  id: "outros",
  name: "Outros",
  kind: "expense",
  icon: "circle-dashed",
  tone: "bg-slate-100 text-slate-600 ring-slate-200",
  color: "#64748b",
};

export function getCategory(id: string): Category {
  return CATEGORY_MAP.get(id) ?? FALLBACK_CATEGORY;
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
