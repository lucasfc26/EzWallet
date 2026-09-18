# EzWallet — Roadmap do Backend

> Status: **implementado e validado** (build, migrations, RLS, auth e fluxo completo testados de ponta a ponta, inclusive via browser headless contra a stack Dockerizada). Este documento descreve a arquitetura entregue, as decisões tomadas e o que fica como próximo passo.

## 1. Objetivo

O frontend (`frontend/`) era um app React totalmente mockado: todo o estado vivia em `localStorage`, sem conceito de usuário. Este roadmap descreve a criação de um backend real — **NestJS + Prisma + PostgreSQL com Row Level Security, autenticação JWT com bcrypt e Docker** — e a integração desse backend ao frontend existente, substituindo o mock por dados reais persistidos em banco.

O comentário que já existia em `frontend/src/services/storage.ts` previa exatamente isso:

> "The UI only talks to this service, so swapping it by a real HTTP client later is a single-file change."

Essa promessa foi o fio condutor da integração: `useFinance.tsx` e todas as páginas/componentes continuam iguais — só `financeService.ts` passou a falar com a API em vez do `localStorage`.

## 2. Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | Node.js | 22 |
| Framework backend | NestJS | 12 |
| ORM | Prisma (`prisma-client-js`) | 6.19 |
| Banco | PostgreSQL | 16 |
| Autenticação | Passport JWT (`@nestjs/jwt`, `passport-jwt`) | — |
| Hash de senha | bcryptjs | 3 |
| Validação | class-validator / class-transformer | — |
| Containers | Docker + Docker Compose | — |
| Proxy/estático do frontend | Nginx | 1.27 |

Frontend mantém a stack original (React 19, Vite, Tailwind 4, react-hook-form + zod, recharts) — nada disso mudou.

## 3. Arquitetura do monorepo

```
EzWallet/
├── frontend/              # React + Vite (já existia)
│   ├── Dockerfile          # build -> serve estático via Nginx
│   └── nginx.conf          # proxy /api/* -> backend:3000
├── backend/                # NestJS + Prisma (novo)
│   ├── src/
│   │   ├── auth/            # login, registro, refresh, JWT strategy/guard
│   │   ├── users/           # busca/criação de usuário (sem RLS, ver §5)
│   │   ├── expenses/        # CRUD de despesas
│   │   ├── incomes/         # CRUD de receitas
│   │   ├── charges/         # CRUD de cobranças + settle()
│   │   ├── finance/         # GET /finance/all (agrega os três acima)
│   │   ├── prisma/          # PrismaService com o helper forUser()
│   │   └── common/          # decorators, categorias válidas, utilitário de datas
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts          # porta os dados de frontend/src/data/seed.ts pro Postgres
│   │   └── migrations/      # init + enable_rls
│   └── Dockerfile           # multi-stage, roda `prisma migrate deploy` no entrypoint
├── docker-compose.yml       # postgres + backend + frontend
└── ROADMAP.md
```

Todo tráfego do navegador para a API passa pelo Nginx do frontend (`/api/*` → container `backend`), então browser e API são **same-origin** do ponto de vista do cliente — importante para o cookie de refresh (§6).

## 4. Modelagem de dados

O schema do Prisma espelha 1:1 os tipos já definidos em `frontend/src/types/index.ts` (`Expense`, `Income`, `Charge`, enums de status/recorrência/forma de pagamento). Valores monetários continuam **inteiros em centavos**, igual ao frontend.

```
User 1───* Expense
User 1───* Income  ──0..1─── Charge (Income.chargeId)
User 1───* Charge
User 1───* RefreshToken
```

Decisão deliberada: **categorias não viraram uma tabela**. `frontend/src/data/categories.ts` continua sendo a fonte da verdade (ícones, cores, tom do Tailwind são responsabilidade de UI). O backend só valida `categoryId` contra a lista de ids em `backend/src/common/constants/categories.ts` — mantenha os dois arquivos em sincronia se adicionar uma categoria nova.

## 5. Row Level Security (RLS)

Este é o ponto mais importante do design de segurança. Em vez de cada `service` filtrar manualmente `WHERE userId = ...` (fácil de esquecer em um `findMany` novo), o **Postgres impõe o isolamento entre contas**, na camada de banco.

### 5.1 Dois roles, dois propósitos

O `docker-entrypoint-initdb.d` (`backend/docker/init-db.sh`) cria dois roles ao subir o container do Postgres pela primeira vez:

- **`ezwallet_owner`** — dono do schema. Usado **só** pelo Prisma Migrate (`MIGRATE_DATABASE_URL`).
- **`ezwallet_app`** — role de runtime, usado pela API (`DATABASE_URL`). Nunca é dono de tabela.

Isso importa porque **o dono de uma tabela sempre ignora RLS no Postgres**, não importa a policy. Se a API conectasse com o role dono, RLS viraria decoração. Por isso a separação de roles não é boilerplate — é o que faz a política valer.

### 5.2 As políticas

Migration `backend/prisma/migrations/20260917224500_enable_rls/migration.sql` habilita RLS em `expenses`, `incomes`, `charges` e `refresh_tokens`, cada uma com:

```sql
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "expenses"
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
```

- `FORCE` faz a policy valer até para o dono da tabela numa sessão `psql` manual — só um superuser ou role com `BYPASSRLS` escapa.
- `current_setting(..., true)` retorna `NULL` em vez de dar erro quando a variável nunca foi setada — e `user_id = NULL` nunca é verdadeiro. **Sem contexto de tenant, a query não erra: ela simplesmente não vê nenhuma linha.** Falha fechada, não aberta.
- `users` **não tem policy**: login/registro precisam localizar um usuário pelo e-mail antes de qualquer contexto de tenant existir — é uma operação inerentemente "pré-tenant".

### 5.3 Como o contexto é definido a cada request

`backend/src/prisma/prisma.service.ts`:

```ts
forUser<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return this.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
```

Todo service (`ExpensesService`, `IncomesService`, `ChargesService`) chama `this.prisma.forUser(userId, tx => ...)`. O terceiro argumento de `set_config` (`true`) escopa o valor à transação (equivalente a `SET LOCAL`) — ele nunca vaza para outra requisição que reutilize a mesma conexão do pool.

### 5.4 Validado, não só documentado

Isso foi testado de verdade contra um Postgres real, não só assumido:

- Inserir sem contexto de tenant → **bloqueado até para o role dono** (prova que `FORCE` está ativo).
- Usuário A e usuário B, cada um só vê suas próprias linhas.
- Via API: criei uma segunda conta (`outro@test.com`), logada, `GET /finance/all` retornou `{ transactions: [], charges: [] }` — zero acesso aos dados do usuário demo.

## 6. Autenticação — bcrypt + JWT

- **Senha**: hash com `bcryptjs`, 12 rounds. Trocado de `bcrypt` nativo para `bcryptjs` (puro JS) para não depender de compilação nativa (`node-gyp`) dentro da imagem Alpine do Docker — evita builds frágeis sem trade-off relevante numa app deste porte.
- **Access token**: JWT assinado (`ACCESS_TOKEN_SECRET`), 15 min de validade, enviado no header `Authorization: Bearer`. Vive **só em memória** no frontend (`frontend/src/lib/tokenStore.ts`) — nunca em `localStorage`, para reduzir o raio de um XSS.
- **Refresh token**: JWT separado (`REFRESH_TOKEN_SECRET`), 7 dias, entregue como **cookie httpOnly** (`Secure` em produção, `SameSite=Lax`, `path=/api/auth`). Um hash SHA-256 dele fica salvo em `refresh_tokens` (RLS-protegido) para permitir revogação/rotação — a cada `/auth/refresh`, o token antigo é marcado como revogado e um novo é emitido.
- **Guard global**: `JwtAuthGuard` é registrado via `APP_GUARD` — toda rota exige token válido por padrão; rotas de auth (`register`, `login`, `refresh`) usam `@Public()` para escapar dessa exigência.

Fluxo no frontend (`frontend/src/services/api.ts` + `frontend/src/hooks/useAuth.tsx`):

1. Ao montar, `AuthProvider` tenta `POST /auth/refresh` silenciosamente (cookie já existente) para restaurar a sessão sem exigir login de novo a cada F5.
2. Toda chamada autenticada anexa o access token em memória.
3. Um único 401 dispara uma tentativa de refresh e repete a chamada original; refreshes concorrentes compartilham a mesma promise em voo (evita corrida de múltiplos refreshes simultâneos).

## 7. Endpoints da API

Prefixo global: `/api`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria conta, retorna access token + seta cookie de refresh |
| POST | `/auth/login` | Idem, para conta existente |
| POST | `/auth/refresh` | Rotaciona o refresh token (lê do cookie) |
| POST | `/auth/logout` | Revoga o refresh token atual |
| GET | `/auth/me` | Usuário autenticado |
| GET | `/finance/all` | `{ transactions, charges }` — espelha `financeService.fetchAll()` |
| GET/POST | `/expenses` | Listar / criar despesa |
| PATCH/DELETE | `/expenses/:id` | Atualizar / remover |
| GET/POST | `/incomes` | Listar / criar receita |
| PATCH/DELETE | `/incomes/:id` | Atualizar / remover |
| GET/POST | `/charges` | Listar / criar cobrança |
| PATCH/DELETE | `/charges/:id` | Atualizar / remover (status só aceita `pending`/`canceled` aqui) |
| POST | `/charges/:id/settle` | Marca como recebida **e** gera a receita correspondente, atomicamente |

`settle()` roda numa única transação (`prisma.forUser`) que atualiza a cobrança e cria a receita — replicando a regra de negócio original do mock: *"uma cobrança pendente nunca conta como receita"*.

## 8. Docker

```bash
cp .env.example .env        # gere segredos antes de subir em produção de verdade
docker compose up -d --build
```

Sobe três serviços:

- **`postgres`** — roda `backend/docker/init-db.sh` na primeira inicialização (cria os dois roles).
- **`backend`** — `backend/docker/entrypoint.sh` roda `prisma migrate deploy` (idempotente) antes de iniciar o Nest.
- **`frontend`** — build de produção do Vite (via `vite-plugin-singlefile`, já existente) servido por Nginx, que faz proxy de `/api/*` para o container `backend`.

Popular a conta de demonstração (equivalente aos dados de `frontend/src/data/seed.ts`, agora no Postgres):

```bash
cd backend && npm run prisma:seed
# demo@ezwallet.app / demo1234
```

O seed não roda automaticamente dentro do container de produção (a imagem de runtime não carrega `ts-node`, de propósito, para manter a imagem enxuta) — é um comando único de setup, rodado do host apontando pro `DATABASE_URL` do compose.

## 9. O que mudou no frontend

| Arquivo | Mudança |
|---|---|
| `src/services/financeService.ts` | Reescrito: chama a API (`fetch`) em vez de `localStorage`. Mesmos nomes de método que o `useFinance.tsx` já esperava. |
| `src/services/storage.ts` | **Removido** — não tem mais consumidor. |
| `src/data/seed.ts` | **Removido** — os mesmos dados agora vivem em `backend/prisma/seed.ts`, como linhas reais de banco. |
| `src/services/api.ts` | **Novo** — wrapper de `fetch` com retry de refresh em 401. |
| `src/lib/tokenStore.ts` | **Novo** — access token em memória, fora do React, para o `api.ts` ler. |
| `src/hooks/useAuth.tsx` | **Novo** — `AuthProvider`/`useAuth`: login, registro, logout, bootstrap via refresh silencioso. |
| `src/hooks/useFinance.tsx` | Métodos internos passaram a chamar endpoints por tipo (`updateExpense`/`updateIncome` em vez de um `updateTransaction` genérico) — necessário porque o backend tem tabelas separadas para despesa/receita. **A interface pública do hook não mudou**: nenhuma página ou componente precisou ser tocado além do listado aqui. |
| `src/pages/Login`, `src/pages/Register` | **Novas** telas, usando os mesmos componentes de UI (`Card`, `Input`, `Button`) do resto do app. |
| `src/components/RequireAuth.tsx` | **Novo** — guarda de rota, redireciona pra `/login` se não autenticado. |
| `src/App.tsx` | `/login` e `/registrar` públicas; árvore principal envolvida por `RequireAuth` + `FinanceProvider`. |
| `src/layouts/AppLayout.tsx` | Botão "Restaurar dados demo" (fazia sentido só com `localStorage`) trocado por nome do usuário + "Sair". |
| `vite.config.ts` | Proxy de dev `/api` → `localhost:3000`, espelhando o proxy do Nginx em produção. |

### Por que `resetDemo` saiu

O botão "Restaurar dados demo" existia porque o mock vivia inteiro no `localStorage` do navegador — resetar era seguro e local. Com contas reais persistidas, um botão de um clique que apaga os lançamentos de um usuário de verdade e recoloca dados fake é uma pegadinha perigosa, não uma conveniência. Foi removido; o equivalente para desenvolvimento é `npm run prisma:seed` (idempotente — só semeia se a conta demo ainda não existir).

## 10. Decisões e trade-offs registrados

- **Prisma 7 foi tentado e revertido para 6.19.** A v7 exige `prisma.config.ts` + *driver adapters* (`@prisma/adapter-pg`) em vez do clássico `url`/`directUrl` no `schema.prisma`. Para manter o projeto no caminho mais documentado/estável (e não introduzir mais uma peça nova em um projeto já com bastante superfície nova), fixamos `prisma`/`@prisma/client` em `6.19.3`.
- **`bcrypt` → `bcryptjs`** para evitar compilação nativa dentro do Alpine (ver §6).
- **Cookie httpOnly + access token em memória**, em vez de tudo em `localStorage` — trade-off deliberado de mais uma chamada de rede (`/auth/refresh` ao montar) em troca de reduzir a superfície de um XSS a roubar sessão.
- **Categorias continuam no frontend** (§4) — evita uma tabela e um endpoint só para servir ícone/cor, que é dado de UI, não de domínio.

## 11. Como rodar

**Produção (Docker, recomendado para ver tudo funcionando):**
```bash
cp .env.example .env    # ajuste os segredos
docker compose up -d --build
cd backend && npm run prisma:seed   # popula a conta demo
```
Frontend em `http://localhost:8080`, API em `http://localhost:8080/api` (via proxy) ou diretamente em `http://localhost:3000/api`.

**Desenvolvimento (hot reload):**
```bash
docker compose up -d postgres
cd backend && cp .env.example .env   # aponte DATABASE_URL/MIGRATE_DATABASE_URL pra localhost:5432
npm install && npm run prisma:migrate:deploy && npm run prisma:seed && npm run start:dev
cd ../frontend && npm install && npm run dev   # usa o proxy /api do vite.config.ts
```

## 12. Validado nesta entrega

- `npm run build` do backend (NestJS/TypeScript) sem erros.
- `tsc --noEmit` e `vite build` do frontend sem erros.
- RLS testado com SQL puro (owner bloqueado sem contexto, isolamento entre dois usuários) e via API (segundo usuário registrado não enxerga dados do primeiro).
- Fluxo completo testado num browser headless real (Playwright) contra a stack **Dockerizada** (não só em dev): redirecionamento para `/login` quando deslogado, login, dashboard populado com dados reais do Postgres, criação de despesa persistida via UI, navegação em Cobranças, logout.

## 13. Próximos passos (fora do escopo desta entrega)

- Testes automatizados (e2e do Nest com Postgres de teste; componentes React).
- Rate limiting em `/auth/login` e `/auth/register` (força bruta).
- Job de limpeza de `refresh_tokens` expirados/revogados.
- Paginação em `/expenses`, `/incomes`, `/charges` (hoje o dataset de demonstração é pequeno o bastante para não precisar).
- Página de "esqueci minha senha" (hoje não existe fluxo de recuperação).
- CI (lint + build + migrate + testes) antes de deploy.
