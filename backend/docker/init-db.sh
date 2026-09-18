#!/bin/bash
# Runs once, only when the Postgres data volume is first created.
# Creates two roles instead of using the default superuser for everything:
#   - $POSTGRES_OWNER_USER owns the schema and is the only role Prisma Migrate uses.
#   - $POSTGRES_APP_USER is what the NestJS API connects as at runtime. It never
#     owns a table, so it can never bypass Row Level Security — table owners
#     always bypass RLS in Postgres, no matter what the policies say.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE ROLE ${POSTGRES_OWNER_USER} WITH LOGIN PASSWORD '${POSTGRES_OWNER_PASSWORD}';
  CREATE ROLE ${POSTGRES_APP_USER} WITH LOGIN PASSWORD '${POSTGRES_APP_PASSWORD}';

  ALTER DATABASE ${POSTGRES_DB} OWNER TO ${POSTGRES_OWNER_USER};
  ALTER SCHEMA public OWNER TO ${POSTGRES_OWNER_USER};

  GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_APP_USER};
  GRANT USAGE ON SCHEMA public TO ${POSTGRES_APP_USER};

  -- Any table/sequence the owner creates from now on (i.e. every future
  -- Prisma migration) automatically grants DML rights to the app role.
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_OWNER_USER} IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${POSTGRES_APP_USER};
  ALTER DEFAULT PRIVILEGES FOR ROLE ${POSTGRES_OWNER_USER} IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO ${POSTGRES_APP_USER};
EOSQL
