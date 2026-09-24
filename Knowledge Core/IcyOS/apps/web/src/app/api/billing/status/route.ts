import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';
import { getBillingAccount } from '../../../../lib/billing/server';
import { hasAccess, trialDaysLeft } from '../../../../lib/billing/entitlement';
import { PLANS } from '../../../../lib/billing/plans';

export async function GET() {
  const account = await getBillingAccount(await createServerSupabaseClient());
  if (!account) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const sub = account.subscription;
  return jsonResponse({
    plan: sub?.plan ?? null,
    status: sub?.status ?? null,
    seats: sub?.seats ?? 1,
    hasAccess: hasAccess(sub),
    trialDaysLeft: trialDaysLeft(sub),
    currentPeriodEnd: sub?.current_period_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
    hasStripeCustomer: Boolean(sub?.stripe_customer_id),
    plans: PLANS.map(({ plan, name, perSeat }) => ({ plan, name, perSeat })),
  });
}
