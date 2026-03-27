# CreateExpenseUseCase — Full Dependency Flow

Traces every class that touches `POST /api/v1/expenses`, from the HTTP request
hitting the gateway all the way to the SQLite write and back. Explains why each
layer exists.

---

## The complete flow for `POST /api/v1/expenses`

```
HTTP POST /api/v1/expenses
  Authorization: Bearer <jwt>
  Body: { amountCents: 1500, currency: "USD", category: "FOOD", description: "Lunch", date: "2026-03-27" }
```

---

## Phase 1 — Gateway: the request enters the system

NestJS processes the incoming request through the **global middleware stack**,
registered in `apps/gateway/src/main.ts:36–57` in this order:

### 1. `LoggingInterceptor`
`main.ts:44` — registered first in `useGlobalInterceptors()`. Generates a UUID
traceId, stamps it into the request, sets `X-Trace-Id` on the response, and logs
`→ POST /api/v1/expenses`. It wraps the entire handler in an RxJS `tap` — so it
runs before anything else and observes the result on the way out.

**File:** `apps/gateway/src/common/interceptors/logging.interceptor.ts`

---

### 2. `JwtAuthGuard`
**File:** `apps/gateway/src/common/guards/jwt-auth.guard.ts:25–36`

```typescript
canActivate(context) {
  const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [handler, class]);
  if (isPublic) return true;
  return super.canActivate(context);  // → Passport JWT strategy
}
```

The guard asks the `Reflector`: "is `@Public()` on this handler or class?" It's
not — `ExpensesController` has no `@Public()`. So it calls `super.canActivate()`,
which triggers Passport's `JwtStrategy`.

**JwtStrategy** (`apps/gateway/src/auth/strategies/jwt.strategy.ts`) extracts
the Bearer token, verifies the signature against `JWT_SECRET`, checks expiry. If
valid, it calls `validate(payload)` which returns `{ sub, email }`. This becomes
`request.user`.

If the token is missing or invalid, `handleRequest` throws `UnauthorizedException`
and the request dies here — the controller is never reached.

---

### 3. `ValidationPipe`
**File:** `apps/gateway/src/main.ts:51–56`

```typescript
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```

The pipe sees `@Body() dto: CreateExpenseDto`. It instantiates `CreateExpenseDto`
from the raw JSON body and runs all `class-validator` decorators against it:

- `@IsInt()` + `@Min(1)` on `amountCents`
- `@IsEnum(ExpenseCategory)` on `category`
- `@MaxLength(500)` on `description`
- `@IsDateString()` on `date`

If any fail, it throws `BadRequestException` with the validation messages. The
`GlobalExceptionFilter` catches it and returns
`{ statusCode: 400, code: 'BAD_REQUEST', message: '...' }`. Controller never runs.

`whitelist: true` strips extra fields the client sent. `forbidNonWhitelisted: true`
means if the client sends `{ amountCents: 1500, hackerField: "x" }`, it gets a 400,
not a silent strip.

---

### 4. `ExpensesController.create` (gateway)
**File:** `apps/gateway/src/expenses/expenses.controller.ts:67–74`

```typescript
async create(
  @CurrentUser() user: JwtPayload,
  @Body() dto: CreateExpenseDto,
): Promise<unknown> {
  return firstValueFrom(
    this.client.send(TCP_PATTERNS.EXPENSES_CREATE, { userId: user.sub, dto }),
  );
}
```

`@CurrentUser()` calls `createParamDecorator` which reads `request.user` — the
`JwtPayload` the strategy put there. `user.sub` is the authenticated user's UUID.

**This controller has zero business logic.** It packages `{ userId, dto }` and
calls `this.client.send()`. The `client` is a `ClientProxy` injected via
`EXPENSES_CLIENT_TOKEN` — a TCP connection to expenses-service on port 3001.

`TCP_PATTERNS.EXPENSES_CREATE` is the string `'expenses.create'` from the shared
constants file (`packages/shared/src/constants/tcp-patterns.constants.ts`). Both
sides import the same constant — a typo is a compile error, not a dropped message.

`firstValueFrom()` converts the Observable returned by `client.send()` into a
Promise. The gateway **awaits** the microservice response before returning. This is
synchronous request-reply over TCP, not fire-and-forget.

---

## Phase 2 — The TCP boundary

`client.send()` serialises `{ userId, dto }` to JSON and writes it over the TCP
socket to `expenses-service:3001`. The NestJS TCP transport prefixes messages with
a length header for framing — so it handles partial reads correctly.

On the other side, the expenses-service has been listening since `main.ts` called
`NestFactory.createMicroservice(Transport.TCP, { port: 3001 })`. The transport
layer deserialises the JSON and looks for a `@MessagePattern` matching
`'expenses.create'`.

---

## Phase 3 — expenses-service: TCP controller

### 5. `ExpensesController.create` (expenses-service)
**File:** `apps/expenses-service/src/expenses/expenses.controller.ts:60–71`

```typescript
@MessagePattern(TCP_PATTERNS.EXPENSES_CREATE)
async create(
  @Payload() payload: { userId: string; dto: CreateExpenseDto },
): Promise<Record<string, unknown>> {
  return this.handle(async () => {
    const expense = await this.createExpense.execute({ userId: payload.userId, dto: payload.dto });
    return expense.toJSON();
  });
}
```

`@MessagePattern` is how NestJS TCP microservices route messages — equivalent to
`@Post()` on the HTTP side. `@Payload()` deserialises the TCP message body.

`this.createExpense` is typed as `CreateExpenseUseCase` but injected via
`@Inject(CREATE_EXPENSE_USE_CASE_TOKEN)` — a Symbol. The controller doesn't import
the concrete class, only the interface-equivalent type. **This is DIP at the
controller level.**

The `this.handle()` wrapper (lines 145–159) catches any thrown `AppException` and
converts it to `RpcException`. Without this, if `DomainException` is thrown three
layers deep, NestJS microservices would swallow it and return a generic error. With
it, the exception's `{ code, message, statusCode }` survives the TCP boundary
intact.

---

## Phase 4 — Application layer: the use-case

### 6. `CreateExpenseUseCase.execute`
**File:** `apps/expenses-service/src/expenses/application/use-cases/create-expense.use-case.ts:26–37`

```typescript
async execute(command: CreateExpenseCommand): Promise<Expense> {
  const expense = Expense.create({
    userId: command.userId,
    amountCents: command.dto.amountCents,
    currency: command.dto.currency,
    category: command.dto.category,
    description: command.dto.description,
    date: command.dto.date,
  });
  return this.expenseRepository.save(expense);
}
```

This is the application layer. Its job is to orchestrate domain objects and
persistence. It does two things: create the entity, save it. No HTTP concepts, no
SQL concepts. It depends on `IExpenseRepository` (an interface), injected via
`EXPENSE_REPOSITORY_TOKEN`.

**Why a use-case class instead of a service method?**
Because `ExpenseService.create()` grows. A year from now it has `create`, `update`,
`delete`, `list`, `getSummary`, `export`, `importFromCsv` — all in one class. One
class, many reasons to change. Each use-case class has exactly one public method
and one reason to change. Adding `ExportExpenseUseCase` doesn't touch
`CreateExpenseUseCase`.

---

## Phase 5 — Domain layer: the entity and value object

### 7. `Expense.create`
**File:** `apps/expenses-service/src/expenses/domain/entities/expense.entity.ts:75–106`

```typescript
static create(props: CreateExpenseProps): Expense {
  if (!props.userId?.trim()) throw new DomainException('INVALID_USER', ...);
  if (props.description.length > 500) throw new DomainException('DESCRIPTION_TOO_LONG', ...);
  if (!props.description.trim()) throw new DomainException('INVALID_DESCRIPTION', ...);

  const money = Money.fromCents(props.amountCents, props.currency);
  const date = new Date(props.date);
  if (isNaN(date.getTime())) throw new DomainException('INVALID_DATE', ...);

  return new Expense(uuidv4(), props.userId, money, props.category, props.description.trim(), date, now, now);
}
```

The private constructor means **there is no other way to create an Expense**. You
cannot do `new Expense(...)` from anywhere else in the codebase — TypeScript
forbids it at compile time. The only doors in are:

- `Expense.create()` — new expense, validates all invariants
- `Expense.reconstitute()` — loaded from DB, skips validation (trusted data path)

This isn't a convention or a comment — it's enforced by the type system.

---

### 8. `Money.fromCents`
**File:** `apps/expenses-service/src/expenses/domain/value-objects/money.value-object.ts:26–38`

```typescript
static fromCents(amountCents: number, currency: string): Money {
  if (!Number.isInteger(amountCents)) throw new DomainException('INVALID_AMOUNT', ...);
  if (amountCents <= 0)              throw new DomainException('INVALID_AMOUNT', ...);
  if (normalizedCurrency.length !== 3) throw new DomainException('INVALID_CURRENCY', ...);
  return new Money(amountCents, normalizedCurrency);
}
```

`Money` is a **Value Object** — it has no identity (no `id` field), is immutable
(all fields are `readonly`), and is compared by value. It wraps amount and currency
together so they can never be separated. You can't have an Expense with an amount
but no currency, or a currency but no amount.

The `private constructor` again — same enforcement as the entity. The only way to
create `Money` is through its factory.

After `Expense.create()` returns, the use-case has a fully validated `Expense`
object in memory. No invalid state is possible. The entity is now handed to the
repository.

---

## Phase 6 — Infrastructure layer: the repository

### 9. `SqliteExpenseRepository.save`
**File:** `apps/expenses-service/src/expenses/infrastructure/repositories/sqlite-expense.repository.ts:127–140`

```typescript
async save(expense: Expense): Promise<Expense> {
  this.stmtInsert.run({
    id: expense.id,
    user_id: expense.userId,
    amount_cents: expense.amount.amountCents,
    currency: expense.amount.currency,
    category: expense.category,
    description: expense.description,
    date: expense.date.toISOString().split('T')[0],
    created_at: expense.createdAt.toISOString(),
    updated_at: expense.updatedAt.toISOString(),
  });
  return Promise.resolve(expense);
}
```

`stmtInsert` was compiled in the constructor via `db.prepare(...)`. Every call to
`.run()` reuses the cached query plan — no SQL parsing on this hot path. Parameters
are passed as named bindings (`@id`, `@user_id`), not string interpolation, so SQL
injection is structurally impossible.

Notice what the repository receives: a fully valid `Expense` entity. It doesn't
validate anything — it trusts the entity. Domain validation lives in the domain
layer, not here. If you need to add a new business rule ("expenses can't be in the
future"), you add it to `Expense.create()` — not scattered across every place that
saves an expense.

The repository returns the same `expense` object it received (not a re-fetched
row). This avoids a second DB round-trip for a simple insert — the entity already
has all the data.

---

## Phase 7 — The return path

### 10. Back to the TCP controller
**File:** `apps/expenses-service/src/expenses/expenses.controller.ts:65–70`

```typescript
const expense = await this.createExpense.execute(...);
return expense.toJSON();
```

`expense.toJSON()` converts the domain entity to a plain `Record<string, unknown>`
— the only shape that can cross a TCP socket. The domain entity itself is not
serialised; it becomes a raw object. This is where the domain boundary ends.

The TCP transport serialises this to JSON and sends it back to the gateway.

---

### 11. Back to the gateway controller
**File:** `apps/gateway/src/expenses/expenses.controller.ts:71–73`

`firstValueFrom()` resolves with the deserialised TCP response. The controller
returns it as `Promise<unknown>`.

---

### 12. `TransformInterceptor`
**File:** `apps/gateway/src/common/interceptors/transform.interceptor.ts:26–42`

```typescript
return next.handle().pipe(
  map((data) => {
    if (this.isPaginatedResult(data)) { ... }
    return { data };
  })
);
```

Intercepts the controller's return value. Since `save` returns a single expense
(not paginated), it takes the `return { data }` branch. The raw expense JSON
becomes `{ data: { id, userId, amountCents, ... } }`.

---

### 13. `LoggingInterceptor` closes out

The `tap` on the way back logs `← POST /api/v1/expenses 201 +34ms [traceId]`.

---

## The final HTTP response

```json
HTTP 201 Created
X-Trace-Id: a3f7c82e-...

{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "...",
    "amountCents": 1500,
    "currency": "USD",
    "category": "FOOD",
    "description": "Lunch",
    "date": "2026-03-27",
    "createdAt": "2026-03-27T12:00:00.000Z",
    "updatedAt": "2026-03-27T12:00:00.000Z"
  }
}
```

---

## Why each layer exists

| Layer | Class | File | Why it exists |
|---|---|---|---|
| Global middleware | `LoggingInterceptor`, `JwtAuthGuard`, `ValidationPipe` | `apps/gateway/src/main.ts` | Cross-cutting concerns that must apply to *every* route, enforced at bootstrap so they can't be forgotten |
| Gateway HTTP controller | `ExpensesController` (gateway) | `apps/gateway/src/expenses/expenses.controller.ts` | Translates HTTP → TCP. Zero business logic — swappable for GraphQL without touching anything else |
| TCP transport | `ClientProxy` / `@MessagePattern` | NestJS internals | Decouples gateway from service at the network level — service port is never exposed |
| TCP controller | `ExpensesController` (service) | `apps/expenses-service/src/expenses/expenses.controller.ts` | Translates TCP payload → use-case command; converts all errors to `RpcException` so they survive the transport |
| Use case | `CreateExpenseUseCase` | `apps/expenses-service/src/expenses/application/use-cases/create-expense.use-case.ts` | One class, one operation. Orchestrates domain + persistence. Adding features never touches this class |
| Domain entity | `Expense.create()` | `apps/expenses-service/src/expenses/domain/entities/expense.entity.ts` | The only door through which an Expense can be born. Invariants enforced once, impossible to bypass |
| Value object | `Money.fromCents()` | `apps/expenses-service/src/expenses/domain/value-objects/money.value-object.ts` | Groups amount + currency inseparably; enforces no-float arithmetic at the type level |
| Repository interface | `IExpenseRepository` | `apps/expenses-service/src/expenses/domain/repositories/expense.repository.interface.ts` | The domain says *what* it needs from storage; infrastructure decides *how*. Swap SQLite for DynamoDB by writing one new class |
| Repository impl | `SqliteExpenseRepository.save()` | `apps/expenses-service/src/expenses/infrastructure/repositories/sqlite-expense.repository.ts` | Knows SQL and db schema. Receives only valid entities — does not validate, only persists |

---

## The deeper principle

Each boundary exists to **localise change**. When you swap SQLite for DynamoDB in
Week 3, you write `DynamoExpenseRepository` and change one line in
`expenses.module.ts`. Zero other files change. That's what all these layers are
buying you.
