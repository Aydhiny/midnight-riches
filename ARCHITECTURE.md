# Architecture

## Tech Stack
- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + custom Aceternity-inspired components
- **UI Primitives**: shadcn/ui (Radix under the hood)
- **Auth**: Auth.js v5 (Credentials + Google OAuth)
- **Database**: Neon Postgres via Drizzle ORM
- **Client State**: Zustand
- **Animations**: Framer Motion
- **i18n**: next-intl (EN + BS)
- **Theming**: next-themes (dark/light)

## Folder Structure

```
/src
  /app                    → App Router (layouts, pages, loading, error)
    /api/auth             → Auth.js route handler
    /(main)               → Authenticated layout group
      /game               → Slot machine page
      /wallet             → Wallet management
      /history            → Game history
    /auth                 → Sign in / Sign up pages
  /components
    /ui                   → shadcn primitives + Aceternity-inspired components
    /game                 → Slot machine components
    /shared               → Layout, nav, providers
  /lib
    /db                   → Drizzle client + schema
    /auth                 → Auth.js configuration
    /game                 → Pure game logic (RNG, engine, payouts)
    /validators           → Zod schemas
  /hooks                  → Custom React hooks
  /store                  → Zustand stores
  /server
    /actions              → Server actions (spin, wallet, auth, history)
    /queries              → Drizzle query functions
  /i18n                   → next-intl configuration + messages
  /styles                 → Global CSS
  /types                  → TypeScript type definitions
```

## Data Flow

1. **Spin Request**: Client → Server Action → Game Engine (pure) → DB update → Response
2. **Wallet**: Client state (Zustand) synced from DB on page load and after each action
3. **Auth**: JWT strategy via Auth.js v5, middleware protects routes
4. **Game Engine**: Pure functions with crypto RNG, zero UI dependencies

## Server Action Security

Every server action passes through a 5-layer pipeline:

1. **Auth Guard** — `auth()` session check, rejects with `UNAUTHORIZED`
2. **Rate Limiting** — In-memory sliding window per `action:userId` key
3. **Zod Validation** — Schema validation on all inputs
4. **Optimistic Locking** — Wallet uses `UPDATE ... WHERE balance >= amount RETURNING *`
5. **Structured Errors** — Typed discriminated union: `{ success: true } | { success: false, code }`

A reusable `createAction` HOF (`src/lib/server/action-wrapper.ts`) composes these layers.

## Error Boundary Hierarchy

```
App Root Error Boundary (src/app/error.tsx)
  └── Game Error Boundary (src/app/(main)/game/error.tsx)
```

- Styled error pages with retry/home navigation
- Custom 404 page (`src/app/not-found.tsx`)
- Loading states at app root (`src/app/loading.tsx`)

## Observability

- **Structured Logger** (`src/lib/logger.ts`) — JSON in production, human-readable in dev
- Methods: `info`, `warn`, `error`, `debug`, `action`, `gameOutcome`
- **Instrumentation** (`src/instrumentation.ts`) — Logs server start, node version, environment
- Game outcomes logged with bet, win, outcome type for audit trail

## Key Decisions

- **Server Actions over API Routes**: Reduces boilerplate, collocates mutations
- **Pure Game Engine**: All game logic is testable without React/Next.js
- **Crypto RNG**: Uses `crypto.getRandomValues()` for fair randomness
- **Zustand over Context**: Better performance for frequent wallet/game state updates
- **Drizzle over Prisma**: Better serverless performance with Neon
- **Optimistic Locking over Check-Then-Deduct**: Prevents race condition overdrafts
- **In-Memory Rate Limiting**: Simple, zero-dependency, sufficient for single-instance deployment
