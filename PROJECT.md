# NestJS Expense Tracker — Full Project Reference

A production-grade expense tracking API built as a NestJS monorepo. The project is designed as a learning exercise covering microservices, authentication, domain-driven design, and security best practices.

---

## Table of Contents

1. [Monorepo Structure](#1-monorepo-structure)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Concepts: NestJS Fundamentals](#3-tech-concepts-nestjs-fundamentals)
4. [Tech Concepts: Microservices & TCP Transport](#4-tech-concepts-microservices--tcp-transport)
5. [Tech Concepts: Authentication & JWT](#5-tech-concepts-authentication--jwt)
6. [Tech Concepts: Domain-Driven Design](#6-tech-concepts-domain-driven-design)
7. [The Gateway App](#7-the-gateway-app)
8. [The Expenses-Service App](#8-the-expenses-service-app)
9. [The Shared Package](#9-the-shared-package)
10. [Database](#10-database)
11. [Request Lifecycle — Step by Step](#11-request-lifecycle--step-by-step)
12. [Auth Flows — Step by Step](#12-auth-flows--step-by-step)
13. [Error Handling Across the TCP Boundary](#13-error-handling-across-the-tcp-boundary)
14. [Security Decisions](#14-security-decisions)
15. [File Reference](#15-file-reference)

---

## 1. Monorepo Structure

```
NestJS-Expanse-Tracker/
├── apps/
│   ├── gateway/               # Public HTTP API server (port 3000)
│   └── expenses-service/      # Internal TCP microservice (port 3001)
├── packages/
│   └── shared/                # Shared DTOs, types, constants
├── tsconfig.base.json         # Shared TypeScript compiler options
└── package.json               # Workspace root (npm workspaces)
```

There are two completely separate Node.js processes that run independently:

- **gateway** — the only process that speaks HTTP. It validates requests, enforces auth, and forwards everything to the service over TCP.
- **expenses-service** — has no HTTP interface. It owns all business logic and the database. It only communicates via TCP.

They share code through the `packages/shared` package, which is a regular npm workspace package imported by both apps.

---

## 2. Architecture Overview

```
Client (browser / curl / Postman)
         │
         │  HTTP  (port 3000)
         ▼
┌─────────────────────────────┐
│          GATEWAY            │
│                             │
│  • JWT validation           │
│  • Rate limiting            │
│  • Request validation       │
│  • Response transformation  │
│  • Error normalisation      │
└──────────────┬──────────────┘
               │
               │  TCP request-reply  (port 3001)
               ▼
┌─────────────────────────────┐
│      EXPENSES-SERVICE       │
│                             │
│  • Business logic           │
│  • Domain entities          │
│  • Use cases                │
│  • SQLite persistence       │
└─────────────────────────────┘
```

**Why this split?**

The gateway handles all *protocol concerns* (HTTP, auth headers, rate limiting). The expenses-service handles all *domain concerns* (what makes a valid expense, how tokens are rotated). Each can be scaled, replaced, or tested independently.

---

## 3. Tech Concepts: NestJS Fundamentals

### Dependency Injection (DI)

NestJS has an IoC (Inversion of Control) container. Instead of classes creating their own dependencies with `new`, they declare what they need in their constructor, and NestJS provides the instances.

```typescript
// NestJS reads this constructor and injects AppConfigService automatically
constructor(private readonly config: AppConfigService) {}
```

The DI container is scoped to **modules**. A provider (service, repository, etc.) is only available inside the module that declares it, or in modules that import that module.

### Modules

A `@Module()` is the unit of organisation. It declares:
- `providers` — services/repositories this module creates
- `controllers` — HTTP or TCP handlers
- `imports` — other modules whose exports this module needs
- `exports` — providers this module makes available to importing modules

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [ExpensesController],
  providers: [CreateExpenseUseCase, SqliteExpenseRepository],
})
export class ExpensesModule {}
```

### @Global()

Marking a module `@Global()` means its exports are available to every module in the app without needing to be listed in each module's `imports`. This is used for `AppConfigModule` so config is available everywhere without repetition.

### Providers and Injection Tokens

A provider is anything the DI container manages. By default, a class decorated with `@Injectable()` is its own token. But you can use a Symbol or string as the token to allow injecting different implementations:

```typescript
// Token (a Symbol)
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');

// Registration — bind token to concrete class
{ provide: USER_REPOSITORY_TOKEN, useClass: SqliteUserRepository }

// Injection — receive the concrete instance
@Inject(USER_REPOSITORY_TOKEN)
private readonly userRepository: IUserRepository
```

This is the **Dependency Inversion Principle**: the use-case depends on the abstract interface, not the SQLite implementation. Swapping to a different database only requires changing the module's provider binding.

### Guards

A guard decides whether a request proceeds. Guards run before the controller method. They return `true` (allow) or `false` / throw an exception (deny).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean {
    // check @Public() decorator first, then validate JWT
  }
}
```

Guards can be applied at controller level, route level, or globally via `app.useGlobalGuards()`.

### Interceptors

An interceptor wraps the entire request-response lifecycle. It can transform input before the controller runs, and transform output after it returns. It uses RxJS Observables:

```typescript
intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
  // before: runs before controller
  return next.handle().pipe(
    map(data => ({ data }))  // after: wraps every response
  );
}
```

Interceptors are the right place for cross-cutting concerns like logging and response shaping.

### Filters

An exception filter catches thrown exceptions and turns them into HTTP responses. A single `@Catch()` filter with no arguments catches everything:

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // map any exception to a uniform JSON error response
  }
}
```

### Pipes

A pipe transforms or validates input before it reaches the controller. `ValidationPipe` uses the `class-validator` decorators on DTO classes to reject invalid payloads:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip properties not in the DTO
  forbidNonWhitelisted: true, // 400 if unknown properties are present
  transform: true,           // convert "1" → 1 for @IsNumber() fields
}));
```

### Decorators

Custom parameter decorators extract data from the request object:

```typescript
export const CurrentUser = createParamDecorator(
  (_, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // set by JwtStrategy.validate()
  },
);
```

Custom metadata decorators attach data to routes:

```typescript
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

The guard then reads this metadata via `Reflector` to decide whether to skip JWT validation.

---

## 4. Tech Concepts: Microservices & TCP Transport

### What is a Microservice in NestJS?

In NestJS, a "microservice" is an app that communicates over a non-HTTP transport. This project uses **TCP** (Transmission Control Protocol) — a raw socket connection with NestJS's own message framing on top.

```typescript
// Instead of NestFactory.create() (HTTP)
NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.TCP,
  options: { host: '0.0.0.0', port: 3001 }
})
```

### Request-Reply Pattern

NestJS TCP uses a **synchronous request-reply** model, not fire-and-forget. The gateway sends a message and waits for a response:

```typescript
// Gateway sends and awaits reply
const result = await firstValueFrom(
  this.client.send(TCP_PATTERNS.EXPENSES_CREATE, payload)
);
```

`client.send()` returns an RxJS `Observable`. `firstValueFrom()` converts it to a `Promise`, waiting for the single response value.

### Message Patterns

Messages are routed by a **pattern string**. The gateway sends a pattern; the service has a handler registered for that exact pattern:

```typescript
// Gateway (sender)
this.client.send('expenses.create', { userId, dto })

// Service (receiver)
@MessagePattern('expenses.create')
async create(@Payload() payload) { ... }
```

Patterns are defined as constants in the shared package so a typo is a compile error rather than a silent runtime drop.

### ClientProxy

The gateway injects a `ClientProxy` — NestJS's abstraction over the TCP connection. It is registered via `ClientsModule.registerAsync()` and identified by an injection token:

```typescript
ClientsModule.registerAsync([{
  name: EXPENSES_SERVICE_TOKEN,  // injection token
  useFactory: (config: AppConfigService) => ({
    transport: Transport.TCP,
    options: { host: config.tcpHost, port: config.tcpPort },
  }),
}])
```

### Serialisation

NestJS serialises message payloads as JSON over the TCP socket. Both sides see plain objects — there are no shared class instances across the boundary. This is why entities call `toJSON()` before being returned from the service controller.

### Why TCP and not HTTP between services?

TCP is lower overhead than HTTP (no headers, no HTTP parsing). For internal synchronous service-to-service calls it is simpler and faster. HTTP would make sense if the service needed to be reachable from the public internet or needed REST semantics — it does not.

---

## 5. Tech Concepts: Authentication & JWT

### What is a JWT?

A JSON Web Token (JWT) is a signed, self-contained token. It has three Base64-encoded parts separated by dots:

```
header.payload.signature
```

- **Header** — algorithm used (e.g. HS256)
- **Payload** — the claims: `{ sub: userId, email, iat, exp }`
- **Signature** — HMAC of header + payload using the secret key

Anyone can decode the header and payload (they are not encrypted, just Base64). But without the secret, the signature cannot be forged. The server verifies the signature on every request — if it matches, the payload is trusted.

### Access Token vs Refresh Token

| | Access Token | Refresh Token |
|---|---|---|
| Expiry | 15 minutes | 7 days |
| Secret | `JWT_SECRET` | `JWT_REFRESH_SECRET` |
| Purpose | Authenticate API requests | Get a new access token |
| Stored server-side | No | Hash only |
| Sent on every request | Yes (`Authorization: Bearer`) | No (only to `/auth/refresh`) |

Two different secrets are used so a compromised access token cannot be used to forge a refresh token and vice versa.

### Passport.js

`passport-jwt` is the library that integrates with NestJS guards to extract and verify JWTs. The `JwtStrategy` class configures it:

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // reads Authorization header
  ignoreExpiration: false,                                   // enforce expiry
  secretOrKey: config.jwtSecret,                            // signature verification
});
```

After verification, Passport calls `validate(payload)`. Whatever is returned becomes `request.user`.

### Token Rotation

On every refresh, a new refresh token is issued and the old one is invalidated. This limits the window of opportunity if a refresh token is stolen:

1. Client calls `/auth/refresh` with refresh token
2. Server verifies it matches the stored hash
3. Server issues new access token + new refresh token
4. Server stores hash of the new refresh token (old hash overwritten)

The old refresh token is now invalid. If the attacker tries to use the stolen token after the legitimate user has refreshed, the hash comparison will fail.

### Token Reuse Detection

If a refresh token is used that does not match the stored hash (meaning it was already used once and rotated away), the server treats this as a token theft and revokes the user's session entirely:

```typescript
const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
if (!isValid) {
  // Someone is replaying an old token — revoke everything
  await this.userRepository.updateRefreshToken(user.id, null);
  throw new UnauthorizedException('Refresh token has already been used');
}
```

### Bcrypt

Bcrypt is a password hashing function designed to be slow. The "12 rounds" means the hashing function iterates 2^12 = 4096 times. This makes brute-force attacks expensive. It also generates a random salt per hash, so two identical passwords produce different hashes.

Used for:
- Hashing passwords on register/login
- Hashing refresh tokens before storing them in the database (so a DB leak does not expose valid tokens)

### Timing Attack Prevention

If you return early when a user is not found (before running bcrypt), the response time is measurably shorter than when the user exists and bcrypt runs. An attacker can enumerate valid email addresses by timing response differences.

The fix: always run bcrypt even when the user is not found, using a dummy hash:

```typescript
const dummyHash = '$2b$12$invalidhashpaddingtomatchlength...';
const passwordToCompare = user?.passwordHash ?? dummyHash;
const isValid = await bcrypt.compare(dto.password, passwordToCompare);
// response time is now identical whether or not the user exists
```

---

## 6. Tech Concepts: Domain-Driven Design

### What is DDD?

Domain-Driven Design is an approach to structuring code around the business domain rather than around technical concerns. The core idea: business rules live in the domain layer, not in controllers or database code.

### Layers in This Project

```
Controller       ← TCP handler, no logic, just routing
    ↓
Use Case         ← one business operation (e.g. "register user")
    ↓
Domain Entity    ← business rules and invariants
    ↓
Repository       ← data access, returns domain entities
    ↓
Database         ← SQLite
```

### Entities

An entity is an object with identity (an ID) whose state can change over time. In this project, entities have:

- **Private constructor** — you cannot call `new Expense(...)` directly
- **Static factory methods** — the only way to create an entity
- **Immutable updates** — `update()` returns a new instance, the original is unchanged

```typescript
// The only way to create a new expense — invariants are always checked
const expense = Expense.create({ userId, amountCents, ... });

// Loading from DB — skips validation because data was validated on write
const expense = Expense.reconstitute(row);

// Updates return a new instance — the original is unchanged
const updated = expense.update({ description: 'new text' });
```

**Why two factory methods?** Validation rules can change over time. If you run `create()` validation on data loaded from the database, old records that were valid under previous rules might fail to load. `reconstitute()` trusts that data that was valid when written is still loadable.

### Value Objects

A value object has no identity — it is compared by its values, not by reference. `Money` is a value object:

```typescript
const a = Money.fromCents(1500, 'USD');
const b = Money.fromCents(1500, 'USD');
a.equals(b); // true — same value
```

Money is immutable and carries its validation with it. It is impossible to have a `Money` with a negative amount or an invalid currency — the constructor is private and `fromCents()` throws a `DomainException` if the inputs are invalid.

**Why store amounts as cents?** IEEE 754 floating point cannot represent most decimal fractions exactly. `0.1 + 0.2 === 0.30000000000000004` in JavaScript. At scale, this causes rounding errors in totals and tax calculations. Storing as integers (cents) eliminates the problem entirely.

### Repository Pattern

A repository is an interface that abstracts data access. The use-case depends on the interface, not the concrete class:

```typescript
// Interface (domain layer — knows nothing about SQLite)
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Concrete implementation (infrastructure layer — knows SQLite)
class SqliteUserRepository implements IUserRepository { ... }
```

The DI container wires the interface token to the concrete class. To swap to a different database (e.g. DynamoDB), only the module's provider binding changes — the use-cases are untouched.

### Use Cases

Each use case is a single, named business operation. It takes a command (input), orchestrates domain entities and repositories, and returns a result. Use cases do not know about HTTP or TCP — they only know about the domain.

---

## 7. The Gateway App

The gateway is the only process the outside world talks to. It translates HTTP into TCP.

### Bootstrap (`main.ts`)

All cross-cutting concerns are registered globally in `bootstrap()`, not in individual modules. This means they apply to every route unconditionally and there is one place to audit the middleware stack.

```typescript
app.useGlobalFilters(new GlobalExceptionFilter());       // catch all exceptions
app.useGlobalGuards(new JwtAuthGuard(reflector));        // auth on every route
app.useGlobalInterceptors(
  new LoggingInterceptor(),                              // outer: timing + traceId
  new TransformInterceptor()                             // inner: wrap in ApiResponse<T>
);
app.useGlobalPipes(new ValidationPipe({ ... }));         // validate DTOs
```

Swagger UI is available at `http://localhost:<PORT>/api/docs`.

### Global Request Pipeline

Every request passes through these layers in order:

```
1. LoggingInterceptor (before)   generate UUID traceId, log "→ METHOD /url"
2. JwtAuthGuard                  verify token, skip if @Public()
3. ValidationPipe                validate DTO, strip unknown fields
4. Controller method             extract user, forward to TCP
5. TCP call (awaited)            business logic in expenses-service
6. TransformInterceptor          wrap result in { data, meta? }
7. LoggingInterceptor (after)    log "← METHOD /url 200 +45ms"

If anything throws at any layer:
   → GlobalExceptionFilter       uniform { statusCode, error, message, code }
```

### AppConfigModule

`AppConfigService` is a typed wrapper around NestJS's `ConfigService`. It reads environment variables and exposes them as typed getters:

```typescript
get jwtSecret(): string { return this.configService.getOrThrow('JWT_SECRET'); }
get tcpPort(): number    { return this.configService.getOrThrow<number>('TCP_PORT'); }
```

`getOrThrow` means the app fails at startup if a required variable is missing, rather than failing silently at runtime.

`AppConfigModule` is decorated with `@Global()` so any module can inject `AppConfigService` without importing `AppConfigModule` explicitly.

### Auth Module

Registers the JWT infrastructure:

- **`PassportModule`** — required for the Passport.js strategy integration to work
- **`JwtModule.registerAsync()`** — provides `JwtService`, configured with the secret from config
- **`ClientsModule.registerAsync()`** — registers a TCP `ClientProxy` connected to expenses-service
- **`JwtStrategy`** — the Passport strategy that extracts and verifies Bearer tokens

`JwtStrategy` and `PassportModule` are exported so the globally-registered `JwtAuthGuard` (which uses Passport's `'jwt'` strategy) can function.

#### JwtAuthGuard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 1. Check if the route has @Public() — if so, skip auth
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [...]);
    if (isPublic) return true;

    // 2. Delegate to Passport's JWT strategy
    return super.canActivate(context);
  }
}
```

#### JwtStrategy

After Passport verifies the token signature and expiry, `validate()` is called with the decoded payload. Its return value is stored as `request.user`:

```typescript
validate(payload: JwtPayload): JwtPayload {
  return { sub: payload.sub, email: payload.email };
}
```

### Auth Controller

All three auth routes are `@Public()` (the user does not have a token yet) and rate-limited via `@UseGuards(ThrottlerBehindProxyGuard)`:

| Route | TCP Pattern | Description |
|---|---|---|
| `POST /api/v1/auth/register` | `auth.register` | Create account, receive token pair |
| `POST /api/v1/auth/login` | `auth.login` | Verify credentials, receive token pair |
| `POST /api/v1/auth/refresh` | `auth.refresh` | Exchange refresh token for new pair |

### Expenses Module & Controller

All expense routes require a valid JWT. The controller:
1. Extracts the authenticated user with `@CurrentUser()` (reads `request.user` set by JwtStrategy)
2. Forwards to expenses-service over TCP with `userId` included in the payload
3. Returns the result — `TransformInterceptor` handles the response wrapping

| Route | TCP Pattern | Description |
|---|---|---|
| `POST /api/v1/expenses` | `expenses.create` | Create expense |
| `GET /api/v1/expenses` | `expenses.list` | Paginated list with filters |
| `GET /api/v1/expenses/summary` | `expenses.summary` | Totals grouped by category |
| `GET /api/v1/expenses/:id` | `expenses.findById` | Single expense |
| `PATCH /api/v1/expenses/:id` | `expenses.update` | Partial update |
| `DELETE /api/v1/expenses/:id` | `expenses.delete` | Delete (204 No Content) |

### LoggingInterceptor

Generates a UUID `traceId` per request, attaches it to the response as `X-Trace-Id`, and logs both entry and exit:

```
→ GET /api/v1/expenses  [HTTP [a3f2-...]]
← GET /api/v1/expenses 200 +43ms  [HTTP [a3f2-...]]
```

### TransformInterceptor

Wraps every successful response in `ApiResponse<T>`. Detects paginated results (presence of `items`, `total`, `page`, `limit`) and promotes pagination metadata to the `meta` field:

```json
// Non-paginated
{ "data": { "id": "...", "amountCents": 1500 } }

// Paginated
{
  "data": [{ "id": "..." }, ...],
  "meta": { "page": 1, "limit": 10, "total": 47, "totalPages": 5 }
}
```

### GlobalExceptionFilter

Catches all exceptions and maps them to `ApiErrorResponse`. Three cases:

1. **`RpcException`** (from expenses-service) — deserialise the structured payload, use its `statusCode`, `code`, and `message`
2. **`HttpException`** (from `ValidationPipe`, guards, etc.) — use its status code, map to a code string
3. **Everything else** — return 500, log the stack trace server-side, never expose internals

Error responses always have this shape:
```json
{
  "statusCode": 404,
  "error": "EXPENSE_NOT_FOUND",
  "message": "Expense not found",
  "code": "EXPENSE_NOT_FOUND"
}
```

---

## 8. The Expenses-Service App

A pure TCP microservice. Has no HTTP interface, no public routes, no rate limiting. Owns all business logic and the database.

### Bootstrap (`main.ts`)

```typescript
NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.TCP,
  options: { host: '0.0.0.0', port: tcpPort }
})
```

The TCP port is read from `process.env` before the DI container is ready. This is the only acceptable place in the codebase for direct `process.env` access outside of config services.

### AppConfigService

Exposes:
- `tcpPort` — TCP listen port
- `jwtSecret` — access token secret (for token signing)
- `jwtRefreshSecret` — refresh token secret (separate from access)
- `sqlitePath` — path to the SQLite file
- `isDevelopment` — environment check

### Auth Module

#### RegisterUserUseCase

```
1. findByEmail(email) — check uniqueness before hashing (cheaper)
2. If exists → throw ValidationException('EMAIL_TAKEN', 409)
3. bcrypt.hash(password, 12) — hash password
4. User.create({ email, passwordHash }) — create domain entity
5. userRepository.save(user) — persist
6. jwtService.sign({ sub, email }, { secret: JWT_SECRET, expiresIn: '15m' })
7. jwtService.sign({ sub, email }, { secret: JWT_REFRESH_SECRET, expiresIn: '7d' })
8. bcrypt.hash(refreshToken, 12) — hash refresh token
9. userRepository.updateRefreshToken(user.id, hash) — store hash
10. return { accessToken, refreshToken, expiresIn: 900 }
```

#### LoginUserUseCase

```
1. findByEmail(email)
2. Run bcrypt.compare(password, user?.passwordHash ?? dummyHash)
   — always runs bcrypt to prevent timing attacks
3. If user not found OR password wrong → throw UnauthorizedException (same error)
4. Issue token pair (same as register)
5. Rotate refresh token (overwrite old hash with new hash)
6. return { accessToken, refreshToken, expiresIn: 900 }
```

#### RefreshTokenUseCase

```
1. jwtService.verify(refreshToken, JWT_REFRESH_SECRET)
   — throws if signature invalid or expired
2. findById(payload.sub)
3. If user not found or refreshTokenHash is null → revoked, throw 401
4. bcrypt.compare(refreshToken, user.refreshTokenHash)
5. If mismatch → token reuse detected
     → updateRefreshToken(user.id, null)  — revoke all tokens
     → throw UnauthorizedException
6. Issue new token pair
7. Store hash of new refresh token
8. return { accessToken, newRefreshToken, expiresIn: 900 }
```

#### JwtModule.register({})

Registered with no default secret. Each use-case passes the secret explicitly in `.sign()` and `.verify()` calls, enabling different secrets for access tokens and refresh tokens. `JwtModule` is still needed to inject `JwtService`.

### Expenses Module

#### Use Cases

| Use Case | What it does |
|---|---|
| `CreateExpenseUseCase` | `Expense.create()` → validates invariants → `repository.save()` |
| `GetExpenseUseCase` | `repository.findById(id, userId)` → throws 404 if not found or not owned |
| `ListExpensesUseCase` | `repository.findAll(userId, filters)` → returns `PaginatedResult<Expense>` |
| `UpdateExpenseUseCase` | Load → `expense.update(props)` → re-validates → `repository.update()` |
| `DeleteExpenseUseCase` | Load → `repository.delete(id, userId)` |
| `GetExpenseSummaryUseCase` | `repository.getSummary(userId, dateRange)` → `GROUP BY category` |

Ownership is enforced at every operation. Every repository query includes both `id` AND `userId` — a user cannot read, update, or delete another user's expense even if they know its ID.

#### Expense Entity

```typescript
// Create new — validates all invariants
Expense.create({ userId, amountCents, currency, category, description, date })

// Load from DB — trusted path, skips validation
Expense.reconstitute(row)

// Update — returns new immutable instance, re-runs affected validations
expense.update({ description: 'updated' })
```

Invariants enforced on create:
- `userId` must not be empty
- `description` must be 1–500 characters
- `date` must be a valid ISO 8601 string
- `Money.fromCents(amountCents, currency)` — amount must be a positive integer, currency must be 3-letter ISO 4217

#### Money Value Object

Stores amounts as integer cents to eliminate IEEE 754 float rounding bugs:

```typescript
Money.fromCents(1500, 'USD')      // $15.00
money.toDecimal()                  // 15
money.toString()                   // "USD 15.00"
Money.fromDecimalString("15.00")   // → 1500 cents
```

Validation: amount must be a positive integer, currency must be exactly 3 characters.

#### User Entity

```typescript
User.create({ email, passwordHash })        // new user, generates UUID
User.reconstitute(row)                       // load from DB
user.withRefreshTokenHash(hash)             // immutable update, returns new instance
user.toJSON()                                // { id, email, createdAt } — never exposes hashes
```

Email is lowercased and trimmed on `User.create()` to ensure case-insensitive uniqueness.

### handleRpc Utility

Both TCP controllers use a shared `handleRpc()` function that wraps every use-case call:

```typescript
export async function handleRpc<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppException) {
      throw new RpcException({ code, message, statusCode });
    }
    throw new RpcException({ code: 'INTERNAL_ERROR', statusCode: 500 });
  }
}
```

NestJS microservices swallow raw `AppException` errors and return a generic failure. Wrapping them as `RpcException` with structured data preserves the error details across the TCP boundary so the gateway can reconstruct the correct HTTP response.

### Exception Hierarchy

```
AppException (base)
├── DomainException    (business rule violations, e.g. DESCRIPTION_TOO_LONG)
├── ValidationException (input conflicts, e.g. EMAIL_TAKEN — 409)
├── UnauthorizedException (auth failures — 401)
└── NotFoundException  (resource not found — 404)
```

Each exception carries a stable machine-readable `code` string, a human-readable `message`, and an HTTP `statusCode`.

---

## 9. The Shared Package

Imported by both gateway and expenses-service. Acts as the **contract** between the two processes.

### TCP Patterns (`constants/tcp-patterns.constants.ts`)

```typescript
export const TCP_PATTERNS = {
  EXPENSES_CREATE:   'expenses.create',
  EXPENSES_FIND_BY_ID: 'expenses.findById',
  EXPENSES_LIST:     'expenses.list',
  EXPENSES_UPDATE:   'expenses.update',
  EXPENSES_DELETE:   'expenses.delete',
  EXPENSES_SUMMARY:  'expenses.summary',
  AUTH_REGISTER:     'auth.register',
  AUTH_LOGIN:        'auth.login',
  AUTH_REFRESH:      'auth.refresh',
} as const;
```

Defined once. A typo on either side (sender or receiver) is a TypeScript compile error, not a silent runtime failure where messages disappear with no error.

### DTOs

DTOs (Data Transfer Objects) carry data between layers. `class-validator` decorators on them define the validation rules that `ValidationPipe` enforces.

| DTO | Fields |
|---|---|
| `RegisterDto` | `email`, `password` |
| `LoginDto` | `email`, `password` |
| `RefreshTokenDto` | `refreshToken` |
| `TokenResponseDto` | `accessToken`, `refreshToken`, `expiresIn` |
| `CreateExpenseDto` | `amountCents`, `currency`, `category`, `description`, `date` |
| `UpdateExpenseDto` | All fields optional |
| `ListExpensesQueryDto` | `category?`, `from?`, `to?`, `page`, `limit` |
| `ExpenseSummaryQueryDto` | `from`, `to` |

### Types

```typescript
// Every success response
interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;  // only present for paginated results
}

// Every error response
interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: string;
}

// Paginated data before wrapping
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// JWT payload — what request.user contains after auth
interface JwtPayload {
  sub: string;   // userId
  email: string;
  iat?: number;
  exp?: number;
}
```

### Enums

```typescript
enum ExpenseCategory {
  FOOD      = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  HOUSING   = 'HOUSING',
  HEALTH    = 'HEALTH',
  OTHER     = 'OTHER',
}
```

---

## 10. Database

### Technology

**`better-sqlite3`** — a synchronous SQLite driver for Node.js.

SQLite is a file-based database. The entire database is a single `.db` file. `better-sqlite3` is synchronous (no callbacks, no Promises) because SQLite does not benefit from async I/O — it is a single-writer system and all reads/writes go through one file lock.

No ORM is used. Queries are written as plain SQL with prepared statements, which are compiled once at repository construction and reused on every call.

### Schema

```sql
PRAGMA journal_mode=WAL;      -- Write-Ahead Logging: reads don't block writes
PRAGMA foreign_keys=ON;       -- Enforce FOREIGN KEY constraints (SQLite ignores them by default)

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT    PRIMARY KEY,          -- UUID
  email              TEXT    UNIQUE NOT NULL,       -- lowercased, case-insensitive unique
  password_hash      TEXT    NOT NULL,
  refresh_token_hash TEXT,                          -- NULL when logged out
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),  -- never floats
  currency     TEXT    NOT NULL DEFAULT 'USD',
  category     TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  date         TEXT    NOT NULL,                           -- YYYY-MM-DD
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Query indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_expenses_user_id       ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date     ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
```

**Key design decisions:**

- **WAL mode** — Write-Ahead Logging allows concurrent reads while a write is in progress. Without it, a write locks the entire file.
- **Foreign keys** — SQLite does not enforce foreign key constraints by default. `PRAGMA foreign_keys=ON` must be set each connection.
- **`ON DELETE CASCADE`** — deleting a user automatically deletes all their expenses.
- **Amounts as integers** — `amount_cents INTEGER`, never `REAL`. Eliminates float arithmetic bugs.
- **`CHECK(amount_cents > 0)`** — database-level constraint as a last line of defence (domain validation catches this first).
- **Inline SQL** — `.sql` files are not copied by the TypeScript compiler. Inline SQL avoids a separate build step.

### Migrations

The schema runs on every startup using `IF NOT EXISTS` guards — safe to re-run. This means only additive changes can be made this way. Destructive changes (dropping a column, renaming a table) require a versioned migration runner.

---

## 11. Request Lifecycle — Step by Step

### Authenticated Request: `GET /api/v1/expenses?page=1&limit=10`

```
Client → GET /api/v1/expenses?page=1&limit=10
         Authorization: Bearer eyJhbGc...
```

**Step 1 — LoggingInterceptor (before)**
- Generates `traceId = "a3f2-..."`
- Attaches to `request.traceId`
- Sets response header `X-Trace-Id: a3f2-...`
- Logs `→ GET /api/v1/expenses [HTTP [a3f2-...]]`

**Step 2 — JwtAuthGuard**
- Route is not `@Public()` → proceed with JWT check
- Extracts `eyJhbGc...` from `Authorization: Bearer`
- Verifies signature against `JWT_SECRET`
- Checks `exp` claim — throws 401 if expired
- Calls `JwtStrategy.validate({ sub, email, iat, exp })`
- Stores `{ sub: userId, email }` as `request.user`

**Step 3 — ValidationPipe**
- Parses `?page=1&limit=10` into `ListExpensesQueryDto`
- Validates field types and constraints
- Strips any unknown query parameters

**Step 4 — ExpensesController.list()**
```typescript
async list(@CurrentUser() user: JwtPayload, @Query() filters: ListExpensesQueryDto) {
  return firstValueFrom(
    this.client.send(TCP_PATTERNS.EXPENSES_LIST, { userId: user.sub, filters })
  );
}
```

**Step 5 — TCP message sent**
```json
{ "pattern": "expenses.list", "data": { "userId": "uuid", "filters": { "page": 1, "limit": 10 } } }
```

**Step 6 — expenses-service receives message**
- Routes to `ExpensesController.list()` via `@MessagePattern('expenses.list')`

**Step 7 — ListExpensesUseCase.execute()**
- Calls `repository.findAll(userId, { page: 1, limit: 10 })`

**Step 8 — SqliteExpenseRepository.findAll()**
```sql
SELECT * FROM expenses WHERE user_id = 'uuid' ORDER BY date DESC, created_at DESC LIMIT 10 OFFSET 0;
SELECT COUNT(*) FROM expenses WHERE user_id = 'uuid';
```
- Maps rows to `Expense` objects via `Expense.reconstitute(row)`
- Returns `{ items: [Expense, ...], total: 47, page: 1, limit: 10 }`

**Step 9 — Use case returns, controller serialises**
```typescript
{
  items: result.items.map(e => e.toJSON()),
  total: result.total,
  page: result.page,
  limit: result.limit,
}
```

**Step 10 — TCP response sent back to gateway**

**Step 11 — TransformInterceptor detects pagination**
```json
{
  "data": [{ "id": "...", "amountCents": 1500, ... }, ...],
  "meta": { "page": 1, "limit": 10, "total": 47, "totalPages": 5 }
}
```

**Step 12 — LoggingInterceptor (after)**
- Logs `← GET /api/v1/expenses 200 +43ms [HTTP [a3f2-...]]`

**Step 13 — Response sent to client**
```
HTTP/1.1 200 OK
X-Trace-Id: a3f2-...
Content-Type: application/json

{
  "data": [...],
  "meta": { "page": 1, "limit": 10, "total": 47, "totalPages": 5 }
}
```

---

## 12. Auth Flows — Step by Step

### Register

```
POST /api/v1/auth/register
{ "email": "user@example.com", "password": "secret123" }
```

1. Rate limiter checks — max 10 requests per 60s per IP
2. `@Public()` — JwtAuthGuard skips token check
3. ValidationPipe validates `RegisterDto`
4. Gateway forwards via TCP: `auth.register` pattern
5. `RegisterUserUseCase.execute()`:
   - `findByEmail("user@example.com")` → null (not taken)
   - `bcrypt.hash("secret123", 12)` → `"$2b$12$..."`
   - `User.create({ email: "user@example.com", passwordHash })` → entity with UUID
   - `userRepository.save(user)` → INSERT into users
   - Sign access token (15m, JWT_SECRET)
   - Sign refresh token (7d, JWT_REFRESH_SECRET)
   - `bcrypt.hash(refreshToken, 12)` → hash
   - `updateRefreshToken(user.id, hash)` → UPDATE users SET refresh_token_hash
   - Return `{ accessToken, refreshToken, expiresIn: 900 }`
6. TransformInterceptor wraps: `{ data: { accessToken, refreshToken, expiresIn } }`
7. Response: `HTTP 201`

### Login

Same as register steps 3–7 except:
- Step 5 finds the existing user
- Compares provided password against stored hash
- Uses constant-time comparison (runs bcrypt even if user not found)
- Same token pair issuance and rotation

### Token Refresh

```
POST /api/v1/auth/refresh
{ "refreshToken": "eyJhbGc..." }
```

1. Gateway forwards via TCP: `auth.refresh`
2. `RefreshTokenUseCase.execute(refreshToken)`:
   - `jwtService.verify(token, JWT_REFRESH_SECRET)` → if invalid/expired, 401
   - `findById(payload.sub)` → load user
   - If no stored hash → already revoked, 401
   - `bcrypt.compare(token, user.refreshTokenHash)` → if mismatch → reuse detected
     - `updateRefreshToken(user.id, null)` — wipe session
     - 401
   - If valid: issue new token pair
   - Store hash of new refresh token
   - Return new `{ accessToken, refreshToken, expiresIn }`

---

## 13. Error Handling Across the TCP Boundary

The two processes cannot share exception class instances. When the service throws, the error must be serialised across TCP and reconstructed on the gateway side.

### In expenses-service

```typescript
// Domain rule violation
throw new DomainException('DESCRIPTION_TOO_LONG', 'Description must not exceed 500 characters');
// ↑ extends AppException with statusCode: 400

// handleRpc catches it:
throw new RpcException({
  code: 'DESCRIPTION_TOO_LONG',
  message: 'Description must not exceed 500 characters',
  statusCode: 400,
});
```

NestJS TCP serialises `RpcException` as a structured error response.

### In gateway

```typescript
// GlobalExceptionFilter catches RpcException
if (exception instanceof RpcException) {
  const { statusCode, code, message } = parseRpcError(exception.getError());
  response.status(statusCode).json({ statusCode, error: code, message, code });
}
```

### Client receives

```json
HTTP/1.1 400 Bad Request
{
  "statusCode": 400,
  "error": "DESCRIPTION_TOO_LONG",
  "message": "Description must not exceed 500 characters",
  "code": "DESCRIPTION_TOO_LONG"
}
```

The `code` field is stable — the client can use it for conditional logic (`if (code === 'EMAIL_TAKEN') ...`) without parsing the `message` string.

---

## 14. Security Decisions

| Decision | Reason |
|---|---|
| Global `JwtAuthGuard` registered in `bootstrap()` | Module-level guards can be accidentally omitted when importing a module. Bootstrap-level registration applies to every route with no exceptions. |
| `@Public()` to opt out, not `@UseGuards()` to opt in | Secure by default. A new route is protected unless explicitly marked public. |
| Separate secrets for access and refresh tokens | A compromised `JWT_SECRET` cannot be used to forge refresh tokens and vice versa. |
| Refresh tokens stored as bcrypt hashes | If the database is leaked, the attacker has hashes, not valid tokens. |
| Token rotation on every refresh | Limits the window an attacker has to use a stolen refresh token. |
| Token reuse detection → full session revoke | If an old refresh token is presented, someone is replaying a stolen token. Wiping the session prevents further damage. |
| Constant-time password comparison | Prevents timing-based email enumeration attacks. |
| Amounts stored as integer cents | IEEE 754 floats cannot represent `0.1 + 0.2` exactly. Integer arithmetic eliminates balance and rounding bugs. |
| `forbidNonWhitelisted: true` in `ValidationPipe` | Rejects requests with unknown fields rather than silently ignoring them, surfacing client bugs early. |
| `whitelist: true` in `ValidationPipe` | Strips any property not declared on the DTO before it reaches the controller. |
| `toJSON()` never includes `passwordHash` or `refreshTokenHash` | Prevents credential fields from leaking into TCP responses or logs. |
| `ON DELETE CASCADE` on expenses | Deleting a user atomically deletes all their data. No orphaned records. |

---

## 15. File Reference

```
apps/gateway/src/
├── main.ts                                     Bootstrap, global middleware registration
├── app.module.ts                               Root module
├── config/
│   ├── app-config.module.ts                   @Global module exporting AppConfigService
│   ├── app-config.service.ts                  Typed getters for env vars
│   └── app.config.ts                          Joi validation schema for env vars
├── auth/
│   ├── auth.module.ts                         JWT + TCP client setup, exports JwtStrategy
│   ├── auth.controller.ts                     HTTP: /register, /login, /refresh
│   ├── strategies/jwt.strategy.ts             Passport JWT extraction & validation
│   └── tokens.ts                              EXPENSES_SERVICE_TOKEN
├── expenses/
│   ├── expenses.module.ts                     TCP client setup
│   ├── expenses.controller.ts                 HTTP: CRUD for /expenses
│   └── tokens.ts                              Re-exports EXPENSES_SERVICE_TOKEN as EXPENSES_CLIENT_TOKEN
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts          @CurrentUser() — extracts request.user
│   │   └── public.decorator.ts                @Public() — opts route out of JWT auth
│   ├── guards/
│   │   ├── jwt-auth.guard.ts                  Global guard, checks @Public() then JWT
│   │   └── throttler-behind-proxy.guard.ts    Rate limiting, proxy-aware
│   ├── filters/
│   │   └── global-exception.filter.ts         Maps all exceptions to ApiErrorResponse
│   └── interceptors/
│       ├── logging.interceptor.ts             traceId, timing, X-Trace-Id header
│       └── transform.interceptor.ts           Wraps responses in ApiResponse<T>
└── health/
    └── health.controller.ts                   GET /api/health

apps/expenses-service/src/
├── main.ts                                     Bootstrap as TCP microservice
├── app.module.ts                               Root module
├── config/
│   ├── app-config.service.ts                  Typed getters (jwtSecret, jwtRefreshSecret, sqlitePath)
│   └── app.config.ts                          Joi validation schema
├── database/
│   ├── database.module.ts                     Provides DATABASE_TOKEN
│   ├── database.provider.ts                   Opens SQLite, runs INIT_SQL, enables WAL + FK
│   └── tokens.ts                              DATABASE_TOKEN symbol
├── auth/
│   ├── auth.module.ts                         Wires use-cases, repository, JwtModule
│   ├── auth.controller.ts                     TCP: auth.register, auth.login, auth.refresh
│   ├── application/use-cases/
│   │   ├── register-user.use-case.ts          Hash password, create user, issue tokens
│   │   ├── login-user.use-case.ts             Verify password (constant-time), issue tokens
│   │   └── refresh-token.use-case.ts          Verify + rotate refresh token, detect reuse
│   ├── domain/
│   │   ├── entities/user.entity.ts            User entity (private ctor, immutable)
│   │   └── repositories/user.repository.interface.ts
│   ├── infrastructure/repositories/
│   │   └── sqlite-user.repository.ts          Prepared statements for users table
│   └── tokens.ts                              Use-case and repository injection tokens
├── expenses/
│   ├── expenses.module.ts                     Wires use-cases, repository
│   ├── expenses.controller.ts                 TCP: expenses.* patterns
│   ├── application/use-cases/
│   │   ├── create-expense.use-case.ts
│   │   ├── get-expense.use-case.ts
│   │   ├── list-expenses.use-case.ts
│   │   ├── update-expense.use-case.ts
│   │   ├── delete-expense.use-case.ts
│   │   └── get-expense-summary.use-case.ts
│   ├── domain/
│   │   ├── entities/expense.entity.ts         Expense entity (private ctor, immutable)
│   │   ├── value-objects/money.value-object.ts Money as integer cents
│   │   └── repositories/expense.repository.interface.ts
│   ├── infrastructure/repositories/
│   │   └── sqlite-expense.repository.ts       Prepared statements, dynamic filter SQL
│   └── tokens.ts                              Use-case and repository injection tokens
└── common/
    ├── handle-rpc.ts                           Wraps use-case calls, converts AppException → RpcException
    └── exceptions/
        ├── app.exception.ts                   Base exception (code, message, statusCode)
        ├── domain.exception.ts                Business rule violations (400)
        ├── validation.exception.ts            Input conflicts (409)
        ├── unauthorized.exception.ts          Auth failures (401)
        └── not-found.exception.ts             Resource not found (404)

packages/shared/src/
├── constants/
│   └── tcp-patterns.constants.ts             TCP_PATTERNS const object + TcpPattern type
├── dtos/
│   ├── auth/                                  RegisterDto, LoginDto, RefreshTokenDto, TokenResponseDto
│   └── expense/                               CreateExpenseDto, UpdateExpenseDto, ListExpensesQueryDto, ExpenseSummaryQueryDto
├── enums/
│   └── expense-category.enum.ts              FOOD | TRANSPORT | HOUSING | HEALTH | OTHER
└── types/
    ├── api-response.type.ts                   ApiResponse<T>, ApiErrorResponse, PaginatedResult<T>
    ├── jwt-payload.type.ts                    { sub, email, iat?, exp? }
    └── category-summary.type.ts              { category, totalCents, count }
```
