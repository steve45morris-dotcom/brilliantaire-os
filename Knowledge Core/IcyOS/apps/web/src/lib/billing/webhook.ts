import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import { subscriptionRowFromStripe } from './sync';

export const HANDLED_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.paused',
  'customer.subscription.resumed',
]);

export type WebhookOutcome = 'processed' | 'duplicate' | 'ignored';

function subscriptionIdOf(event: Stripe.Event): string | null {
  const object = event.data.object as { object?: string; id?: string; subscription?: string | { id: string } | null };
  if (object.object === 'subscription') return object.id ?? null;
  if (object.object === 'checkout.session' && object.subscription) {
    return typeof object.subscription === 'string' ? object.subscription : object.subscription.id;
  }
  return null;
}

/**
 * Applies a verified Stripe event. Rather than trusting the event payload,
 * which Stripe may deliver late or out of order, it re-fetches the subscription
 * and stores its current state, so replays and reordering are harmless.
 */
export async function handleStripeEvent(
  event: Stripe.Event,
  stripe: Stripe,
  db: SupabaseClient,
  env: Record<string, string | undefined> = process.env
): Promise<WebhookOutcome> {
  if (!HANDLED_EVENTS.has(event.type)) return 'ignored';

  const { data: seen } = await db
    .from('billing_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();
  if (seen) return 'duplicate';

  const subscriptionId = subscriptionIdOf(event);
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const row = subscriptionRowFromStripe(subscription, env);

    // Checkout stamps user_id on the subscription; fall back to the customer id
    // recorded at checkout for subscriptions created another way.
    let userId = subscription.metadata?.user_id || null;
    if (!userId) {
      const { data } = await db
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', row.stripe_customer_id)
        .maybeSingle();
      userId = data?.user_id ?? null;
    }
    if (!userId) throw new Error(`No IcyOS user for Stripe subscription ${subscriptionId}`);

    const { error } = await db.from('subscriptions').upsert({ user_id: userId, ...row }, { onConflict: 'user_id' });
    if (error) throw new Error(`Failed to store subscription ${subscriptionId}: ${error.message}`);
  }

  // Recorded only after the work succeeds, so a failed attempt is retried by Stripe.
  const { error } = await db
    .from('billing_events')
    .upsert({ stripe_event_id: event.id, type: event.type }, { onConflict: 'stripe_event_id', ignoreDuplicates: true });
  if (error) throw new Error(`Failed to record event ${event.id}: ${error.message}`);

  return 'processed';
}
