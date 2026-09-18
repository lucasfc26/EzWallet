-- Row Level Security: every tenant-owned table is filtered by the Postgres
-- session variable `app.current_user_id`, set per-request by PrismaService
-- (see src/prisma/prisma.service.ts) before any query runs.
--
-- `current_setting(..., true)` returns NULL instead of raising when the
-- variable was never set, and `user_id = NULL` is never true — so a request
-- that forgets to set the tenant context sees zero rows instead of every
-- user's data. RLS fails closed, not open.
--
-- FORCE ROW LEVEL SECURITY makes the policy apply even to the table owner
-- (ezwallet_owner) — e.g. an ad-hoc `psql` session — not just to the
-- unprivileged runtime role (ezwallet_app) the API connects as. Only an
-- actual Postgres superuser or a role with BYPASSRLS can still see past it.
--
-- The `users` table intentionally has NO policy: authentication (looking a
-- user up by email during login, or creating one during registration)
-- necessarily happens before any tenant context exists.

ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "expenses"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE "incomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incomes" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "incomes"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE "charges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "charges" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "charges"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "refresh_tokens"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
