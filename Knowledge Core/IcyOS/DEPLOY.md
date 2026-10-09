# IcyOS Deployment Guide

For a first launch, follow `LAUNCH.md`: it is the step-by-step, and it ends with `pnpm launch-check`. This guide adds the detail behind those steps, plus Docker.

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
- A Stripe account, only if you charge (see `BILLING_ENFORCEMENT` below)

## Environment Variables

Copy `.env.example` to `apps/web/.env` and fill in each value:

### Supabase

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL, e.g. `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key from Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (never expose to the client) — used for billing sync, personal access tokens and account deletion |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase → Settings → API → JWT settings. Required for personal access tokens (P.J.K.) |

### Legal pages

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` | Address shown on the Terms and Privacy pages for legal and privacy requests (see `apps/web/LEGAL.md`) |
| `NEXT_PUBLIC_HOSTING_PROVIDER` | Who hosts the app, named on the Privacy page, e.g. `Vercel` |

### Stripe Billing

Charging is on unless `BILLING_ENFORCEMENT=off`. Without Stripe configured, a new account's trial ends with no way to pay, so either set the Stripe variables or set `BILLING_ENFORCEMENT=off` (recommended for a private first launch).

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Secret key from Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from your webhook endpoint (see Webhook Setup below) |
| `STRIPE_PRICE_STARTER` | Price ID for the Starter plan |
| `STRIPE_PRICE_PRO` | Price ID for the Pro plan |
| `STRIPE_PRICE_TEAM` | Price ID for the Team plan (per seat) |
| `BILLING_ENFORCEMENT` | `off` disables the subscription paywall; anything else, or unset, enforces it |

### Optional

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude sorts Inbox brain dumps. Without it, simple rules do |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Share rate-limit counters between instances. Without them each instance counts on its own |
| `NEXT_PUBLIC_PJK_URL` | Default P.J.K. address for the P.J.K. page. Without it, the page asks for one |
| `PORT` | Host port for the Docker container (default `3000`) |

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Run all migrations in order from `supabase/migrations/`, `01` through `28_fix_account_lifecycle.sql`:
   ```bash
   # Using the Supabase CLI:
   supabase db push
   ```
   Or paste each file into the SQL Editor, oldest first. `LAUNCH.md` says what each one adds.
3. Enable Email auth in Supabase → Authentication → Providers.
4. Copy the URL, anon key, service-role key and JWT secret into your `.env`.

## Stripe Setup

1. Create three products in Stripe, each with a monthly recurring price you choose: **Starter**, **Pro** and **Team**. Make Team's price per unit, since its quantity is the number of seats.
2. Copy each price ID (starts with `price_`) into your `.env`.
3. Create a webhook endpoint pointed at `https://your-domain/api/billing/webhook` with these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

See `apps/web/BILLING.md` for the full Stripe integration reference.

## Vercel Deployment (Recommended)

### First-time setup

1. Install the Vercel CLI: `pnpm add -g vercel`
2. From the `Knowledge Core/IcyOS` directory:
   ```bash
   vercel link
   ```
   Select your Vercel team/account and create a new project. The project's Root Directory is the IcyOS monorepo root: `.` when linking from this folder, or `Knowledge Core/IcyOS` when importing the GitHub repo in the Vercel dashboard. `vercel.json` there sets the install, build and output paths.

3. Add environment variables in Vercel Dashboard → Project → Settings → Environment Variables:
   - All required variables from the tables above (Supabase, legal pages), plus any optional ones you use
   - Either the Stripe variables, or `BILLING_ENFORCEMENT=off`

4. Deploy:
   ```bash
   vercel --prod
   ```

### Automatic deployments (CI/CD)

The `.github/workflows/icyos-deploy.yml` workflow deploys to Vercel on every push to `main` that touches IcyOS files. Until the three secrets below are set, it doesn't deploy. The run passes with a warning ("IcyOS wasn't deployed"), and its summary page names the missing secrets and where to find each one. A missing setting no longer turns `main` red. Once the secrets are set, a deploy that fails still fails the run. Meanwhile, deploy by hand with `vercel --prod`.

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

In IcyOS, open Settings → Personal access tokens, name it, pick an expiry and issue it. It is shown once. A token acts as the user who created it, on the routes below only.

### Using a token

Pass the token as a Bearer token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer icy_your_token_here" \
  https://your-domain/api/workspace
```

### Supported token endpoints

`apps/web/src/lib/auth/token-routes.ts` is the list. In short:

- `/api/workspace`; `/api/projects` and `/api/projects/[id]`, with `/missions` under a project
- `/api/missions/[id]` and its `/steps`; `/api/actions/[id]` and `/api/actions/complete`
- `/api/inbox/sort` and `/api/inbox/add`
- `/api/timeline`, `/api/timeline/propose`, `/api/timeline/save`
- `/api/focus`, `/api/focus/start`, `/api/focus/[id]`; `/api/review`
- `/api/knowledge` and `/api/knowledge/[id]`; `/api/pjk/status`

Tokens never reach billing, onboarding, settings, account export or deletion, or token management.

### Rate limits

Every `/api/*` request is limited to 300 per minute per IP address. On top of that, a token is limited by its SHA-256 hash, and a signed-in user by their id:
- AI generation: 10 requests/min
- Write operations: 60 requests/min
- Read operations: 120 requests/min

## Production Checklist

- [ ] Supabase project created and migrations 01–28 applied (`supabase db push`)
- [ ] All required env vars set, including `SUPABASE_JWT_SECRET` and the two legal-page variables (Vercel Dashboard or `apps/web/.env` for Docker)
- [ ] Billing decided: either `BILLING_ENFORCEMENT=off` (no charging yet), or all of the following:
  - [ ] Stripe products created (Starter, Pro, Team) with price IDs configured
  - [ ] Stripe webhook endpoint pointed at `https://<domain>/api/billing/webhook`
  - [ ] `BILLING_ENFORCEMENT` unset (or anything but `off`)
- [ ] Terms of Service entity name confirmed (LLC/Inc suffix) and reviewed by legal
- [ ] Custom domain configured with HTTPS
- [ ] Supabase Auth site URL updated to production domain
- [ ] For Vercel: GitHub secrets set (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] For Docker: HTTPS/TLS termination configured (reverse proxy)
- [ ] For multiple instances: set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so rate-limit counters are shared (without them each instance counts on its own)
- [ ] `pnpm launch-check` says **Ready** (see `LAUNCH.md`, step 7)
