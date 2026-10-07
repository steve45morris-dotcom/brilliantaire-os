import { NextResponse } from 'next/server';
import { authenticateRequest } from '../../../lib/auth/request-auth';
import { jsonResponse, errorResponse } from '../../../lib/api/response';
import { getServiceDb, getStripe } from '../../../lib/billing/server';
import { ENDED_STATUSES } from '../../../lib/billing/webhook';

export async function DELETE(req: Request): Promise<NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  if (auth.via === 'token') {
    return errorResponse('forbidden', 'Account deletion requires a browser session', null, 403);
  }

  // Stop the charges first. If Stripe can't be reached, keep the account, so
  // the person isn't left paying for something they can no longer sign in to.
  const { data: subscription } = await auth.db
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .maybeSingle();
  if (subscription?.stripe_subscription_id && !ENDED_STATUSES.has(subscription.status)) {
    try {
      await getStripe().subscriptions.cancel(subscription.stripe_subscription_id);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      // Already gone in Stripe: nothing left to cancel.
      if (e.code !== 'resource_missing') {
        console.error('Stripe cancel before account deletion failed:', e.message);
        return errorResponse('billing_error', 'Could not cancel your subscription, so nothing was deleted. Please try again.', null, 502);
      }
    }
  }

  const { error } = await auth.db.rpc('delete_account');
  if (error) {
    console.error('delete_account failed:', error.message);
    return errorResponse('internal_error', 'Could not delete account. Please try again.', null, 500);
  }

  try {
    const service = getServiceDb();
    await service.auth.admin.deleteUser(auth.authUserId);
  } catch (err) {
    console.error('auth.admin.deleteUser failed:', (err as Error).message);
  }

  return jsonResponse({ deleted: true });
}
