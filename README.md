# Expense Tracker — NestJS Monorepo

Production-grade expense tracking API built as a learning project. Every decision reflects
real-world senior-level conventions, not tutorial shortcuts.

## Architecture

```
Root (npm workspaces)
├── packages/shared          — Shared types, DTOs, enums, TCP constants
├── apps/gateway             — HTTP API (port 3000) — validates, authenticates, delegates
└── apps/expenses-service    — TCP microservice (port 3001) — business logic, SQLite storage
```

Communication: Gateway → expenses-service via NestJS TCP transport (ClientProxy).
The service port is never exposed externally — only gateway is public-facing.

## Quick Start

### Option A: Non-Docker (local dev)

```bash
# 1. Install all workspace dependencies
npm install

# 2. Build shared package (apps depend on it)
npm run build:shared

# 3. Start both services (in two terminals, or use the combined command)
npm run dev

# Or individually:
npm run dev:expenses   # terminal 1
npm run dev:gateway    # terminal 2
```

**Gateway** starts at `http://localhost:3000`
**Swagger UI** at `http://localhost:3000/api/docs`

### Option B: Docker

```bash
# Create a .env file at the root (or export the vars)
cp .env.example .env
# Edit .env with your values (especially JWT_SECRET and JWT_REFRESH_SECRET)

docker-compose up --build
```

## API

### Auth (all routes are public / rate-limited)
```
POST /api/v1/auth/register    { email, password }
POST /api/v1/auth/login       { email, password }
POST /api/v1/auth/refresh     { refreshToken }
```

### Expenses (require Bearer token)
```
POST   /api/v1/expenses                           Create expense
GET    /api/v1/expenses?category=FOOD&from=...    List with filters + pagination
GET    /api/v1/expenses/summary?from=...&to=...   Category totals
GET    /api/v1/expenses/:id                       Get one
PATCH  /api/v1/expenses/:id                       Update (partial)
DELETE /api/v1/expenses/:id                       Delete
```

### Example: Register and create an expense

```bash
# Register
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}' \
  | jq -r '.data.accessToken')

# Create expense (amount in cents: 1500 = $15.00)
curl -X POST http://localhost:3000/api/v1/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amountCents":1500,"currency":"USD","category":"FOOD","description":"Lunch","date":"2026-03-27"}'
```

## Architectural Patterns (where to look first)

| Pattern | File |
|---|---|
| Domain entity + factory method | `apps/expenses-service/src/expenses/domain/entities/expense.entity.ts` |
| Value object (Money in cents) | `apps/expenses-service/src/expenses/domain/value-objects/money.value-object.ts` |
| Repository interface (DIP) | `apps/expenses-service/src/expenses/domain/repositories/expense.repository.interface.ts` |
| SQLite repository (prepared stmts) | `apps/expenses-service/src/expenses/infrastructure/repositories/sqlite-expense.repository.ts` |
| Injection tokens (Symbol DI) | `apps/expenses-service/src/expenses/tokens.ts` |
| Use-case pattern (SRP) | `apps/expenses-service/src/expenses/application/use-cases/create-expense.use-case.ts` |
| TCP controller (error → RpcException) | `apps/expenses-service/src/expenses/expenses.controller.ts` |
| JWT auth + @Public() opt-out | `apps/gateway/src/common/guards/jwt-auth.guard.ts` |
| @CurrentUser() decorator | `apps/gateway/src/common/decorators/current-user.decorator.ts` |
| Global exception filter | `apps/gateway/src/common/filters/global-exception.filter.ts` |
| Response transform interceptor | `apps/gateway/src/common/interceptors/transform.interceptor.ts` |
| Config fail-fast (Joi) | `apps/expenses-service/src/config/app.config.ts` |
| Typed config wrapper | `apps/expenses-service/src/config/app-config.service.ts` |
| Bootstrap global middleware | `apps/gateway/src/main.ts` |
| TCP patterns (shared constants) | `packages/shared/src/constants/tcp-patterns.constants.ts` |
| Multi-stage Dockerfile | `apps/expenses-service/Dockerfile` |
| DB migration on startup | `apps/expenses-service/src/database/database.provider.ts` |
| Refresh token rotation | `apps/expenses-service/src/auth/application/use-cases/login-user.use-case.ts` |

## Three Things A Junior Dev Would Have Done Differently

### 1. Used an ORM instead of raw prepared statements
A junior dev would reach for TypeORM or Prisma immediately. Here, we use `better-sqlite3`
with **prepared statements stored as class fields**. Why it matters at scale:
- Prepared statements are compiled once — the query plan is cached, reducing CPU per request
- No ORM query-builder magic means SQL is explicit, auditable, and optimisable
- In Week 3 when we swap to DynamoDB, the ORM abstraction would have leaked everywhere anyway
  (`@Entity()` decorators on domain objects, etc). Raw repository keeps the domain clean.

### 2. Put JWT secret validation in application code, not at startup
A junior dev would do `process.env.JWT_SECRET ?? 'default'` and discover the missing secret
when the first login fails in production. Here, Joi validation in `appConfigSchema` crashes
the process **before it accepts a single TCP connection** if JWT_SECRET is missing or under
32 characters. The fail-fast behaviour surfaces config problems in CI, not production.

### 3. Stored refresh tokens in plaintext
A junior dev would store the raw refresh token string in the database. If the `users` table is
ever compromised (SQL injection, backup leak, insider threat), every user's session is
immediately hijackable. Here, we store a **bcrypt hash** of the refresh token. The attacker
gets only the hash — they cannot reverse it to replay the token. Rotation detection also
works: if a refresh token is reused after rotation, we null out the hash and revoke all sessions.

## Week Roadmap

| Week | Focus |
|---|---|
| 1 (now) | Monorepo scaffold, expenses API, JWT auth |
| 2 | RabbitMQ event bus, async patterns |
| 3 | AWS Cognito auth swap, DynamoDB repository |
| 4 | AWS Bedrock AI summaries, Kafka event streaming |
