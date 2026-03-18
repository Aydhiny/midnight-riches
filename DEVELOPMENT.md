# Development Guide

## Prerequisites
- Node.js 20+
- npm 10+
- Docker (optional, for local Postgres)

## Quick Start

1. Clone and install:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure `.env` with your Neon database URL and auth secret.

4. Generate and run migrations:
```bash
npm run db:generate
npm run db:push
```

5. Start dev server:
```bash
npm run dev
```

## Docker Local Dev

```bash
docker-compose up -d
```

This starts a local Postgres instance and the Next.js app.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `AUTH_SECRET` | Yes | Auth.js secret (generate with `openssl rand -base64 32`) |
| `AUTH_URL` | No | Auth.js URL (defaults to `http://localhost:3000`) |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |

## Database Commands

```bash
npm run db:generate   # Generate migration files
npm run db:migrate    # Run migrations
npm run db:push       # Push schema to database (dev)
npm run db:studio     # Open Drizzle Studio
npm run db:seed       # Seed test user + 50 game sessions
npm run db:reset      # Delete all data (FK-safe order)
```

### Seed Data

`npm run db:seed` creates:
- Test user: `test@midnight-riches.dev` / `password123`
- Wallet with $1,000 balance
- 50 game sessions (win/loss/bonus mix)
- Corresponding transactions

## Testing

```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (text + HTML in /coverage)
```

Test suite covers:
- **RNG** — 100k spin statistical distribution (±2% tolerance)
- **Game Engine** — Payout evaluation, wild substitution, scatter triggers, bonus state, all 7³ symbol combos
- **Validators** — All 5 Zod schemas (spin, deposit, signUp, signIn, historyFilter)
- **Server Actions** — Auth guard, rate limiting, validation, optimistic locking, structured errors
- **Wallet Invariant** — Balance can never go negative

## Linting & Type Checking

```bash
npx tsc --noEmit       # Type check (must be zero errors)
npx eslint . --max-warnings 0  # Lint (must be zero warnings)
```

## Bundle Analysis

```bash
npm run analyze        # Opens bundle analyzer report
```

## Build

```bash
npm run build
npm run start
```
