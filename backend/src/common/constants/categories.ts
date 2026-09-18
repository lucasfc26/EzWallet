/**
 * Category taxonomy is owned by the frontend (frontend/src/data/categories.ts
 * — icons/colors/labels are a UI concern). This list mirrors only the ids, so
 * the API can validate categoryId without a round-trip. Keep both in sync.
 */
export const EXPENSE_CATEGORY_IDS = [
  'alimentacao',
  'transporte',
  'moradia',
  'saude',
  'educacao',
  'lazer',
  'compras',
  'assinaturas',
  'outros',
] as const;

export const INCOME_CATEGORY_IDS = [
  'salario',
  'freelance',
  'cobrancas',
  'investimentos',
  'outras-receitas',
] as const;
