import type Stripe from 'stripe';
import { planForPriceId, type Plan } from './plans';

export interface SubscriptionRow {
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: Plan | null;
  status: string;
  seats: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
}

const toIso = (seconds: number | null | undefined) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

/** Maps a Stripe subscription to the columns IcyOS stores for it. */
export function subscriptionRowFromStripe(
  sub: Stripe.Subscription,
  env: Record<string, string | undefined> = process.env,
  now = new Date()
): SubscriptionRow {
  const item = sub.items.data[0];
  return {
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    plan: planForPriceId(item?.price.id, env),
    status: sub.status,
    seats: item?.quantity ?? 1,
    trial_ends_at: toIso(sub.trial_end),
    // Since API 2025-03-31 the billing period lives on the subscription item.
    current_period_end: toIso(item?.current_period_end),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: now.toISOString(),
  };
}
