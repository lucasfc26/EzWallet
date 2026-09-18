export const DEFAULT_CATEGORIES = [
  { slug: 'alimentacao', name: 'Alimentação', kind: 'expense' as const, icon: 'utensils', color: '#f97316' },
  { slug: 'transporte', name: 'Transporte', kind: 'expense' as const, icon: 'car', color: '#0ea5e9' },
  { slug: 'moradia', name: 'Moradia', kind: 'expense' as const, icon: 'home', color: '#8b5cf6' },
  { slug: 'saude', name: 'Saúde', kind: 'expense' as const, icon: 'heart-pulse', color: '#f43f5e' },
  { slug: 'educacao', name: 'Educação', kind: 'expense' as const, icon: 'graduation-cap', color: '#6366f1' },
  { slug: 'lazer', name: 'Lazer', kind: 'expense' as const, icon: 'party-popper', color: '#f59e0b' },
  { slug: 'compras', name: 'Compras', kind: 'expense' as const, icon: 'shopping-bag', color: '#ec4899' },
  { slug: 'assinaturas', name: 'Assinaturas', kind: 'expense' as const, icon: 'repeat', color: '#14b8a6' },
  { slug: 'outros', name: 'Outros', kind: 'expense' as const, icon: 'circle-dashed', color: '#64748b' },
  { slug: 'salario', name: 'Salário', kind: 'income' as const, icon: 'briefcase', color: '#10b981' },
  { slug: 'freelance', name: 'Freelance', kind: 'income' as const, icon: 'laptop', color: '#059669' },
  { slug: 'cobrancas', name: 'Cobranças', kind: 'income' as const, icon: 'hand-coins', color: '#34d399' },
  { slug: 'investimentos', name: 'Investimentos', kind: 'income' as const, icon: 'trending-up', color: '#22c55e' },
  { slug: 'outras-receitas', name: 'Outras receitas', kind: 'income' as const, icon: 'circle-plus', color: '#4ade80' },
];

export const PROTECTED_CATEGORY_SLUGS = ['cobrancas'] as const;

export const FALLBACK_SLUG: Record<'expense' | 'income', string> = {
  expense: 'outros',
  income: 'outras-receitas',
};
