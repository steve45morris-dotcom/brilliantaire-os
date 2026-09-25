import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';
import { getBillingAccount, getServiceDb, getStripe } from '../../../../lib/billing/server';
import { isPlan, priceIdFor, quantityFor } from '../../../../lib/billing/plans';

const schema = z.object({
  plan: z.string().refine(isPlan, 'Unknown plan'),
  seats: z.number().int().optional(),
});

// Stripe rejects a trial_end less than 48 hours away.
const MIN_TRIAL_CARRYOVER_MS = 48 * 3_600_000;

export async function POST(req: NextRequest) {
  const check = await validatePayload(req, schema);
  if (!check.success) return check.response;
  const plan = check.data.plan as Parameters<typeof priceIdFor>[0];

  const account = await getBillingAccount(await createServerSupabaseClient());
  if (!account) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const sub = account.subscription;
  if (sub?.stripe_subscription_id && !['canceled', 'incomplete_expired'].includes(sub.status)) {
    return errorResponse('subscription_exists', 'Manage your existing subscription from the billing portal', null, 409);
  }

  const price = priceIdFor(plan);
  if (!price) return errorResponse('plan_unavailable', `The ${plan} plan is not configured`, null, 503);
  const quantity = quantityFor(plan, check.data.seats);
  if (quantity === null) return errorResponse('validation_error', 'Invalid seat count', { seats: check.data.seats }, 400);

  const stripe = getStripe();

  // One Stripe customer per user, created on first checkout and remembered.
  let customerId = sub?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create(
      { email: account.email ?? undefined, metadata: { user_id: account.userId } },
      { idempotencyKey: `customer-${account.userId}` }
    );
    customerId = customer.id;
    const { error } = await getServiceDb()
      .from('subscriptions')
      .upsert({ user_id: account.userId, stripe_customer_id: customerId }, { onConflict: 'user_id' });
    if (error) return errorResponse('internal_error', 'Could not save billing customer', null, 500);
  }

  // Subscribing mid-trial keeps the remaining free days instead of charging today.
  const trialEnd = sub?.status === 'trialing' && sub.trial_ends_at ? Date.parse(sub.trial_ends_at) : 0;
  const carryTrial = trialEnd - Date.now() > MIN_TRIAL_CARRYOVER_MS;

  const origin = req.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: account.userId,
    line_items: [{ price, quantity }],
    subscription_data: {
      metadata: { user_id: account.userId },
      ...(carryTrial ? { trial_end: Math.floor(trialEnd / 1000) } : {}),
    },
    allow_promotion_codes: true,
    custom_text: {
      submit: {
        message: `By subscribing you agree to the Terms of Service (${origin}/terms), including automatic monthly renewal until you cancel and no partial refunds.`,
      },
    },
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=canceled`,
  });

  return jsonResponse({ url: session.url });
}
