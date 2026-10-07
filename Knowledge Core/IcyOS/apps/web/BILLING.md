# Billing (Stripe)

Each user has one subscription. A new account gets a 14-day free trial with no
card. When the trial ends, the app sends pages to `/billing` and the API answers
`402 payment_required` until the user subscribes.

| Plan | Billing | Price env var |
|---|---|---|
| Starter | flat, monthly | `STRIPE_PRICE_STARTER` |
| Pro | flat, monthly | `STRIPE_PRICE_PRO` |
| Team | per seat, monthly | `STRIPE_PRICE_TEAM` |

Prices and amounts live in Stripe. Changing a price means creating a new Stripe
price and updating the env var. No deploy of code is needed.

## How it works

- **Checkout.** `POST /api/billing/checkout` with `{ plan, seats? }` creates the
  user's Stripe customer the first time and remembers its id, then opens Stripe
  Checkout.
  - **Mid-trial checkout:** a user who subscribes during the trial keeps the
    remaining free days, as long as more than 48 hours are left. Stripe rejects
    anything shorter.
- **Self-service.** `POST /api/billing/portal` opens the Stripe Customer Portal,
  where users change plan or seats, update cards, get invoices and cancel.
- **Webhook.** `POST /api/billing/webhook` is public but only acts on events with
  a valid `Stripe-Signature`.
  - **Current state, not the payload:** on each subscription event it fetches
    the subscription from Stripe and stores its current state. That makes
    late, repeated or out-of-order events harmless.
  - **Idempotency:** processed event ids go in `billing_events`, so a duplicate
    event is skipped.
  - **Retries:** failures return 500, and Stripe retries them.
- **Access.** Handled in `src/lib/billing/entitlement.ts`, checked by the
  middleware.
  - **Allowed:** `active`, `past_due` (while Stripe retries the card), and
    `trialing` before the trial ends.
  - **Denied:** everything else.
  - **Always reachable:** `/billing`, `/api/billing/*`, `/api/health`, login and
    auth routes.
- **Data.** Migration `supabase/migrations/19_billing.sql` adds the
  `subscriptions` table.
  - **Reads:** users can read their own row.
  - **Writes:** only the service role (webhook and checkout) writes.
  - **Signup:** each new signup gets a trial row.
  - **Existing users:** get a trial starting when the migration runs.

## Setup

1. Apply migration `19_billing.sql` (after 15–18).
2. In Stripe, create a product for each plan with a monthly recurring price.
   Make Team's price per unit, since its quantity is the number of seats.
3. In Stripe, create a webhook endpoint that points at
   `https://<your-domain>/api/billing/webhook`. Subscribe it to these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
4. Configure the Customer Portal in Stripe. Allow plan switching between the
   three prices and quantity changes on Team.
5. Set these server environment variables, and never expose them to the browser:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` (the signing secret of the endpoint from step 3)
   - `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Optional: `BILLING_ENFORCEMENT=off` turns off the paywall. For example, set it
   while migration 19 or the Stripe keys aren't in place yet. With it on, a
   failed subscription lookup denies access rather than allowing it.

For local testing, run `stripe listen --forward-to localhost:3000/api/billing/webhook`
and use the signing secret it prints.
