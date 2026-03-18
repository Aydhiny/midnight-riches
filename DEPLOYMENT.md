# Deployment

## Vercel Deployment

### Prerequisites
1. Neon Postgres database provisioned
2. Auth secret generated
3. (Optional) Google OAuth credentials

### Steps

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_URL` — your production URL (e.g., `https://midnight-riches.vercel.app`)
   - `AUTH_GOOGLE_ID` — (optional) Google OAuth client ID
   - `AUTH_GOOGLE_SECRET` — (optional) Google OAuth secret
4. Deploy

### Build Settings
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Post-Deploy
- Run `npm run db:push` against production database to create tables
- Or use `npm run db:migrate` for migration-based schema management

## Docker Deployment

```bash
docker build -t midnight-riches .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-neon-url" \
  -e AUTH_SECRET="your-secret" \
  midnight-riches
```

## Environment Variable Reference

| Variable | Required | Where |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Vercel env vars |
| `AUTH_SECRET` | Yes | Vercel env vars |
| `AUTH_URL` | Yes (prod) | Vercel env vars |
| `AUTH_GOOGLE_ID` | No | Vercel env vars |
| `AUTH_GOOGLE_SECRET` | No | Vercel env vars |
| `NEXT_PUBLIC_APP_URL` | No | Vercel env vars |
