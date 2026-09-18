-- Catalog (per-user categories + payment cards) and expense recurrence series.

CREATE TYPE "CategoryKind" AS ENUM ('expense', 'income');
CREATE TYPE "CardBrand" AS ENUM ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other');
CREATE TYPE "CardKind" AS ENUM ('credit', 'debit');

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_user_id_slug_key" ON "categories"("user_id", "slug");
CREATE INDEX "categories_user_id_kind_idx" ON "categories"("user_id", "kind");

ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "payment_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "brand" "CardBrand" NOT NULL,
    "last4" CHAR(4) NOT NULL,
    "kind" "CardKind" NOT NULL DEFAULT 'credit',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_cards_user_id_idx" ON "payment_cards"("user_id");

ALTER TABLE "payment_cards" ADD CONSTRAINT "payment_cards_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses"
  ADD COLUMN "payment_card_id" TEXT,
  ADD COLUMN "recurrence_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "recurrence_group_id" TEXT,
  ADD COLUMN "recurrence_index" INTEGER NOT NULL DEFAULT 1;

-- Seed the default taxonomy for every existing user, keeping the old slug
-- so we can remap expenses/incomes onto the new UUID primary keys.
INSERT INTO "categories" ("id", "user_id", "slug", "name", "kind", "icon", "color", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u.id, d.slug, d.name, d.kind::"CategoryKind", d.icon, d.color, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN (
  VALUES
    ('alimentacao', 'Alimentação', 'expense', 'utensils', '#f97316'),
    ('transporte', 'Transporte', 'expense', 'car', '#0ea5e9'),
    ('moradia', 'Moradia', 'expense', 'home', '#8b5cf6'),
    ('saude', 'Saúde', 'expense', 'heart-pulse', '#f43f5e'),
    ('educacao', 'Educação', 'expense', 'graduation-cap', '#6366f1'),
    ('lazer', 'Lazer', 'expense', 'party-popper', '#f59e0b'),
    ('compras', 'Compras', 'expense', 'shopping-bag', '#ec4899'),
    ('assinaturas', 'Assinaturas', 'expense', 'repeat', '#14b8a6'),
    ('outros', 'Outros', 'expense', 'circle-dashed', '#64748b'),
    ('salario', 'Salário', 'income', 'briefcase', '#10b981'),
    ('freelance', 'Freelance', 'income', 'laptop', '#059669'),
    ('cobrancas', 'Cobranças', 'income', 'hand-coins', '#34d399'),
    ('investimentos', 'Investimentos', 'income', 'trending-up', '#22c55e'),
    ('outras-receitas', 'Outras receitas', 'income', 'circle-plus', '#4ade80')
) AS d(slug, name, kind, icon, color);

UPDATE "expenses" e
SET "category_id" = c.id
FROM "categories" c
WHERE c.user_id = e.user_id AND c.slug = e.category_id;

UPDATE "expenses" e
SET "category_id" = c.id
FROM "categories" c
WHERE c.user_id = e.user_id AND c.slug = 'outros'
  AND NOT EXISTS (SELECT 1 FROM "categories" x WHERE x.id = e.category_id);

UPDATE "incomes" i
SET "category_id" = c.id
FROM "categories" c
WHERE c.user_id = i.user_id AND c.slug = i.category_id;

UPDATE "incomes" i
SET "category_id" = c.id
FROM "categories" c
WHERE c.user_id = i.user_id AND c.slug = 'outras-receitas'
  AND NOT EXISTS (SELECT 1 FROM "categories" x WHERE x.id = i.category_id);

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_card_id_fkey"
  FOREIGN KEY ("payment_card_id") REFERENCES "payment_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "categories"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE "payment_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_cards" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "payment_cards"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
