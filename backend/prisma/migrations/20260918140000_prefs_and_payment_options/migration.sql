-- Monthly spend cap, default category/payment for new expenses, and
-- per-user payment methods (seeded independently so CRUD never leaks).

ALTER TABLE "users"
  ADD COLUMN "monthly_spend_cap" INTEGER,
  ADD COLUMN "default_category_id" TEXT,
  ADD COLUMN "default_payment_option_id" TEXT,
  ADD COLUMN "default_payment_card_id" TEXT;

CREATE TABLE "payment_options" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_options_user_id_slug_key" ON "payment_options"("user_id", "slug");
CREATE INDEX "payment_options_user_id_idx" ON "payment_options"("user_id");

ALTER TABLE "payment_options" ADD CONSTRAINT "payment_options_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses" ADD COLUMN "payment_option_id" TEXT;

INSERT INTO "payment_options" ("id", "user_id", "slug", "name", "method", "created_at", "updated_at")
SELECT gen_random_uuid()::text, u.id, d.slug, d.name, d.method::"PaymentMethod", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN (
  VALUES
    ('pix', 'Pix', 'pix'),
    ('debit', 'Cartão de débito', 'debit'),
    ('credit', 'Cartão de crédito', 'credit'),
    ('cash', 'Dinheiro', 'cash'),
    ('boleto', 'Boleto', 'boleto'),
    ('transfer', 'Transferência', 'transfer')
) AS d(slug, name, method);

UPDATE "expenses" e
SET "payment_option_id" = p.id
FROM "payment_options" p
WHERE p.user_id = e.user_id
  AND p.slug = e.payment_method::text
  AND e.payment_card_id IS NULL;

ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_option_id_fkey"
  FOREIGN KEY ("payment_option_id") REFERENCES "payment_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_options" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_options" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "payment_options"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
