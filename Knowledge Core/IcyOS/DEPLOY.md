# IcyOS Deployment Guide

## Quick Start

```bash
# Run the deployment preflight check
./scripts/setup-deploy.sh
```

## Deployment Options

| Option | Best for | What you need |
|---|---|---|
| **Vercel** (recommended) | SaaS, fast iteration | Vercel account + GitHub repo |
| **Docker** | Self-hosted, on-prem | Docker 24+ host, reverse proxy |

## Prerequisites

- A Supabase project (or self-hosted Supabase instance)
- A Stripe account (for billing)

## Environment Variables

Copy `.env.example` to `apps/web/.env` and fill in each value:

### Supabase

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL, e.g. `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key from Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (never expose to the client) — used for billing sync and onboarding RPC |

### Stripe Billing

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Secret key from Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from your webhook endpoint (see Webhook Setup below) |
| `STRIPE_PRICE_STARTER` | Price ID for the Starter plan ($49/mo) |
| `STRIPE_PRICE_PRO` | Price ID for the Pro plan ($149/mo) |
| `STRIPE_PRICE_TEAM` | Price ID for the Team plan ($299/mo) |
| `BILLING_ENFORCEMENT` | Set to `off` to disable the subscription paywall; omit or set to any other value to enforce billing |

### Optional

| Variable | Description |
|---|---|
| `PORT` | Host port for the Docker container (default `3000`) |

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run all migrations in order from `supabase/migrations/`:
   ```bash
   # Using the Supabase CLI:
   supabase db push
   ```
3. Enable Email auth in Supabase → Authentication → Providers.
4. Copy the URL, anon key, and service-role key into your `.env`.

## Stripe Setup

1. Create three products in Stripe with monthly recurring prices:
   - **Starter** — $49/mo per seat
   - **Pro** — $149/mo per seat
   - **Team** — $299/mo per seat
2. Copy each price ID (starts with `price_`) into your `.env`.
3. Create a webhook endpoint pointed at `https://your-domain/api/billing/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

See `apps/web/BILLING.md` for the full Stripe integration reference.

## Vercel Deployment (Recommended)

### First-time setup

1. Install the Vercel CLI: `pnpm add -g vercel`
2. From the `Knowledge Core/IcyOS` directory:
   ```bash
   vercel link
   ```
   Select your Vercel team/account and create a new project. Set the root directory to `.` (the IcyOS monorepo root).

3. Add environment variables in Vercel Dashboard → Project → Settings → Environment Variables:
   - All variables from the table above (Supabase, Stripe)
   - Set `BILLING_ENFORCEMENT` to `off` until Stripe is configured

4. Deploy:
   ```bash
   vercel --prod
   ```

### Automatic deployments (CI/CD)

The `.github/workflows/icyos-deploy.yml` workflow deploys to Vercel on every push to `main` that touches IcyOS files.

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` (or Vercel → Settings → General → ID) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

### Custom domain

In Vercel Dashboard → Project → Settings → Domains, add your domain. Then update:
- Stripe webhook endpoint to `https://your-domain/api/billing/webhook`
- Supabase → Authentication → URL Configuration → Site URL to `https://your-domain`

## Docker Deployment (Self-Hosted)

### Build and run

```bash
cd "Knowledge Core/IcyOS"
docker compose up -d --build
```

The app starts on port 3000 (override with `PORT=8080 docker compose up -d`).

### Health check

The container includes an automatic health check against `/api/health`. Check status with:

```bash
docker compose ps
# or
curl http://localhost:3000/api/health
```

Expected response: `{"data":{"status":"ok","timestamp":"..."}}`

### Logs

```bash
docker compose logs -f web
```

### Rebuild after code changes

```bash
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

## API Tokens (for P.J.K. and external integrations)

IcyOS supports personal access tokens prefixed with `icy_` for programmatic API access. Tokens are SHA-256 hashed in the database and resolved via the `resolve_api_token()` RPC.

### Creating a token

Authenticated users can create tokens through the API. Tokens grant the same permissions as the user who created them.

### Using a token

Pass the token as a Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer icy_your_token_here" \
  https://your-domain/api/workspace
```

### Supported token endpoints

- `GET /api/workspace` — workspace data
- `GET/POST /api/projects` — list or create projects
- `GET/PUT/DELETE /api/projects/[id]` — single project
- `GET/POST /api/missions` — list or create missions
- `GET/POST /api/steps` — list or create steps
- `GET/POST /api/actions` — list or create actions

### Rate limits

API tokens are rate-limited by the token's SHA-256 hash:
- AI generation: 10 requests/min
- Write operations: 60 requests/min
- Read operations: 120 requests/min

## Production Checklist

- [ ] Supabase project created and migrations applied (`supabase db push`)
- [ ] All env vars set (Vercel Dashboard or `apps/web/.env` for Docker)
- [ ] Stripe products created (Starter $49, Pro $149, Team $299) with price IDs configured
- [ ] Stripe webhook endpoint pointed at `https://<domain>/api/billing/webhook`
- [ ] `BILLING_ENFORCEMENT` is **not** set to `off`
- [ ] Terms of Service entity name confirmed (LLC/Inc suffix) and reviewed by legal
- [ ] Custom domain configured with HTTPS
- [ ] Supabase Auth site URL updated to production domain
- [ ] For Vercel: GitHub secrets set (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] For Docker: HTTPS/TLS termination configured (reverse proxy)
- [ ] For multiple instances: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so rate-limit counters are shared (without them each instance counts on its own)
