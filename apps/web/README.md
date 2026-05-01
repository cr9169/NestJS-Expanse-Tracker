# @app/web — Expense Tracker frontend

React 19 + Vite + TypeScript SPA that talks to the gateway over HTTP. See the
top-level [`PROJECT.md`](../../PROJECT.md) for the full backend architecture and
the plan file at `~/.claude/plans/i-want-to-make-unified-horizon.md` for the
design rationale.

## Stack

| Layer        | Choice                              |
|--------------|-------------------------------------|
| Bundler      | Vite 5                              |
| UI runtime   | React 19                            |
| Routing      | React Router 7 (data router)        |
| Server state | TanStack Query v5                   |
| Forms        | React Hook Form + Zod               |
| Styling      | Tailwind CSS + shadcn/ui (Radix)    |
| Charts       | Recharts                            |
| HTTP         | Axios with refresh-on-401 interceptor |
| Tests        | Vitest + Testing Library            |

## Folder structure

```
src/
├── shared/                  # cross-feature primitives only — no inward feature deps
│   ├── api/                 # http-client, ApiError, queryClient
│   ├── auth/                # TokenStore, AuthProvider, route guards, JWT decode
│   ├── components/ui/       # shadcn/ui primitives (button, card, dialog, etc.)
│   ├── components/layout/   # AppShell, AuthShell, NotificationBell, NotFound
│   ├── hooks/               # use-search-param-state, etc.
│   ├── lib/                 # cn, formatMoney, formatDate, month, toast, category-meta
│   └── schemas/             # Zod mirrors of @app/shared DTOs
├── features/                # one folder per backend bounded context
│   ├── auth/                # login + register pages
│   ├── expenses/            # CRUD, table, filters, summary
│   ├── budgets/             # cards, status, month picker
│   ├── notifications/       # bell + list page
│   ├── analytics/           # trends + breakdown + anomalies
│   └── dashboard/           # composes existing feature hooks
├── routes/                  # createBrowserRouter
├── App.tsx                  # provider wiring
├── main.tsx
└── index.css                # Tailwind directives + theme tokens
```

**Inward dependency rule**: `features/*` may import from `shared/*` but never
the reverse, and features never import each other. Cross-feature composition
happens at the route level or via the layout shell.

## Setup

From the repo root:

```bash
npm install                       # one install hoists all workspaces
cp apps/web/.env.example apps/web/.env
docker-compose up -d rabbitmq kafka
npm run dev:backend               # starts gateway + 5 backend services
npm run dev:web                   # Vite dev server on :5173
```

Then open <http://localhost:5173>. Register a new user; you'll land on the
dashboard.

`npm run dev` from the root starts everything (backend + frontend) at once.

## Auth flow

- Access token kept in memory (lost on tab close — expected).
- Refresh token kept in `localStorage` so reloads resume the session.
- Single in-flight refresh promise coalesces parallel 401s.
- Failed refresh clears tokens, drops cached server state, redirects to `/login`.

## Type sharing

`tsconfig.json` aliases `@shared/*` to `../../packages/shared/src/*`, so this
app imports the **same enums and types** the backend uses (`ExpenseCategory`,
`NotificationType`, `JwtPayload`, etc.) — there is no risk of contract drift.

Zod schemas in `src/shared/schemas/` mirror the backend's `class-validator`
constraints byte-identically. If a constraint changes on the server, it must
change here too — the runtime is the source of truth, but Zod gives instant
feedback in the form before a request goes out.

## Tests

```bash
npm run test --workspace=apps/web
```

The tests cover small, deterministic units (money parsing, month math, token
store behaviour). Component-level tests with MSW are scoped for follow-up.
