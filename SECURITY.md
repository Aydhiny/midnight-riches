# Security

## Authentication

- **Auth.js v5** with JWT strategy
- Password hashing via `bcryptjs` with cost factor 12
- Session validation on every server action via `auth()` guard
- Rate limiting on login (10 req/5min) and signup (5 req/5min)

## Server Action Security Layers

Every server action passes through 5 security layers:

1. **Auth Guard** — Rejects unauthenticated requests with `UNAUTHORIZED`
2. **Rate Limiting** — In-memory sliding window per user/action. Configurable per-action limits
3. **Input Validation** — Zod schema validation on all inputs. Rejects with `VALIDATION_ERROR`
4. **Optimistic Locking** — Wallet mutations use `UPDATE ... WHERE balance >= amount RETURNING *`. Zero rows = insufficient funds, no overdraft possible
5. **Structured Error Returns** — Typed discriminated union responses `{ success: true, ... } | { success: false, error, code }`

## Wallet Integrity

- Balance stored as `DECIMAL(12,2)` — no floating point drift
- Deductions use atomic SQL: `UPDATE wallets SET balance = balance - $amount WHERE user_id = $id AND balance >= $amount`
- If zero rows returned, the action fails with `INSUFFICIENT_FUNDS`
- Balance can never go negative by database-level constraint

## Rate Limiting

| Action  | Limit          |
|---------|----------------|
| Spin    | 30 req/min     |
| Deposit | 10 req/min     |
| Signup  | 5 req/5min     |
| Signin  | 10 req/5min    |
| History | 20 req/min     |
| Wallet  | 20 req/min     |

Implementation: in-memory sliding window (`src/lib/server/rate-limiter.ts`). Keyed by `action:userId`.

## HTTP Security Headers

Applied via `next.config.ts` `headers()`:

- `Content-Security-Policy` — Restricts script/style/image sources
- `Strict-Transport-Security` — HSTS with 1-year max-age, includeSubDomains
- `X-Frame-Options: DENY` — Clickjacking protection
- `X-Content-Type-Options: nosniff` — MIME sniffing prevention
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — Disables camera, microphone, geolocation

## Input Validation Schemas

All user inputs are validated with Zod before processing:

- `spinSchema` — betPerLine must be positive number in allowed set
- `depositSchema` — amount between 1 and 10000
- `signUpSchema` — name, valid email, password 8+ chars
- `signInSchema` — email + password required
- `historyFilterSchema` — page/limit bounds, optional outcome filter

## Error Handling

- Global error boundary at app root (`src/app/error.tsx`)
- Game-level error boundary (`src/app/(main)/game/error.tsx`)
- Structured JSON logging in production (`src/lib/logger.ts`)
- No stack traces or internal details exposed to clients

## Reporting Vulnerabilities

Open an issue or contact the maintainer directly. Do not disclose vulnerabilities publicly before a fix is available.
