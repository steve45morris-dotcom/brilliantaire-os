import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';
import { getBillingAccount, getStripe } from '../../../../lib/billing/server';

// Stripe's hosted portal handles plan changes, seat changes, cards, invoices and cancellation.
export async function POST(req: NextRequest) {
  const account = await getBillingAccount(await createServerSupabaseClient());
  if (!account) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const customer = account.subscription?.stripe_customer_id;
  if (!customer) return errorResponse('no_customer', 'Subscribe to a plan first', null, 409);

  const session = await getStripe().billingPortal.sessions.create({
    customer,
    return_url: `${req.nextUrl.origin}/billing`,
  });
  return jsonResponse({ url: session.url });
}
