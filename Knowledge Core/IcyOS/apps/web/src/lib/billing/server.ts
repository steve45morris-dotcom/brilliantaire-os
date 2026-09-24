import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-only. Never import from client components: these hold secret keys.

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    stripe = new Stripe(key);
  }
  return stripe;
}

let serviceDb: SupabaseClient | null = null;

/**
 * Service-role client. It bypasses RLS, so it is used only for writes the user
 * may not make themselves: recording Stripe ids and webhook state.
 */
export function getServiceDb(): SupabaseClient {
  if (!serviceDb) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    serviceDb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return serviceDb;
}

export interface BillingAccount {
  userId: string;
  email: string | null;
  subscription: {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan: string | null;
    status: string;
    seats: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  } | null;
}

/** The signed-in user's app id, email and subscription row, read through RLS. */
export async function getBillingAccount(userDb: SupabaseClient): Promise<BillingAccount | null> {
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) return null;

  const { data: userId, error } = await userDb.rpc('current_app_user_id');
  if (error || !userId) return null;

  const { data: subscription } = await userDb
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, plan, status, seats, trial_ends_at, current_period_end, cancel_at_period_end')
    .maybeSingle();

  return { userId: userId as string, email: user.email ?? null, subscription: subscription ?? null };
}
