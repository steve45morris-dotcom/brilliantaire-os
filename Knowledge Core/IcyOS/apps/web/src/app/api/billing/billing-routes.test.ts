import { describe, it, expect, vi, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { NextRequest } from 'next/server';

// Real Stripe webhook verification, with Stripe's own test-signature helper.
const realStripe = new Stripe('sk_test_dummy');
const SECRET = 'whsec_test_secret';

const handleStripeEvent = vi.fn();
const customersCreate = vi.fn();
const checkoutCreate = vi.fn();
const upsert = vi.fn();
let account: unknown = null;

vi.mock('../../../lib/billing/webhook', () => ({ handleStripeEvent }));
vi.mock('../../../lib/auth/supabase-server', () => ({ createServerSupabaseClient: async () => ({}) }));
vi.mock('../../../lib/billing/server', () => ({
  getStripe: () => ({
    webhooks: realStripe.webhooks,
    customers: { create: customersCreate },
    checkout: { sessions: { create: checkoutCreate } },
  }),
  getServiceDb: () => ({ from: () => ({ upsert }) }),
  getBillingAccount: async () => account,
}));

const { POST: webhook } = await import('./webhook/route');
const { POST: checkout } = await import('./checkout/route');

function signedWebhook(payload: string, secret = SECRET) {
  const header = realStripe.webhooks.generateTestHeaderString({ payload, secret });
  return new NextRequest('http://localhost/api/billing/webhook', {
    method: 'POST',
    body: payload,
    headers: { 'stripe-signature': header },
  });
}

describe('POST /api/billing/webhook', () => {
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'customer.subscription.updated', data: { object: {} } });

  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    handleStripeEvent.mockReset();
  });

  it('accepts a correctly signed event', async () => {
    handleStripeEvent.mockResolvedValue('processed');
    const response = await webhook(signedWebhook(payload));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, outcome: 'processed' });
    expect(handleStripeEvent.mock.calls[0][0].id).toBe('evt_1');
  });

  it('rejects a bad signature, a tampered body and a missing header', async () => {
    expect((await webhook(signedWebhook(payload, 'whsec_wrong'))).status).toBe(400);

    const tampered = signedWebhook(payload);
    const forged = new NextRequest(tampered.url, {
      method: 'POST',
      body: payload.replace('evt_1', 'evt_2'),
      headers: { 'stripe-signature': tampered.headers.get('stripe-signature')! },
    });
    expect((await webhook(forged)).status).toBe(400);

    expect((await webhook(new NextRequest('http://localhost/api/billing/webhook', { method: 'POST', body: payload }))).status).toBe(400);
    expect(handleStripeEvent).not.toHaveBeenCalled();
  });

  it('returns 500 so Stripe retries when processing fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    handleStripeEvent.mockRejectedValue(new Error('db down'));
    expect((await webhook(signedWebhook(payload))).status).toBe(500);
  });
});

describe('POST /api/billing/checkout', () => {
  const post = (body: object) =>
    new NextRequest('https://app.example.com/api/billing/checkout', { method: 'POST', body: JSON.stringify(body) });

  beforeEach(() => {
    Object.assign(process.env, { STRIPE_PRICE_STARTER: 'price_s', STRIPE_PRICE_PRO: 'price_p', STRIPE_PRICE_TEAM: 'price_t' });
    customersCreate.mockReset().mockResolvedValue({ id: 'cus_new' });
    checkoutCreate.mockReset().mockResolvedValue({ url: 'https://checkout.stripe.com/c/abc' });
    upsert.mockReset().mockResolvedValue({ error: null });
    account = { userId: 'user-1', email: 'a@example.com', subscription: { status: 'trialing', trial_ends_at: new Date(Date.now() + 10 * 86_400_000).toISOString(), stripe_customer_id: null, stripe_subscription_id: null } };
  });

  it('creates the customer once and starts a subscription checkout that keeps the trial', async () => {
    const response = await checkout(post({ plan: 'team', seats: 4 }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.url).toBe('https://checkout.stripe.com/c/abc');
    expect(customersCreate.mock.calls[0][1]).toEqual({ idempotencyKey: 'customer-user-1' });
    expect(upsert).toHaveBeenCalledWith({ user_id: 'user-1', stripe_customer_id: 'cus_new' }, { onConflict: 'user_id' });

    const session = checkoutCreate.mock.calls[0][0];
    expect(session).toMatchObject({
      mode: 'subscription',
      customer: 'cus_new',
      client_reference_id: 'user-1',
      line_items: [{ price: 'price_t', quantity: 4 }],
      success_url: 'https://app.example.com/billing?checkout=success',
    });
    expect(session.subscription_data.metadata).toEqual({ user_id: 'user-1' });
    expect(session.custom_text.submit.message).toContain('https://app.example.com/terms');
    expect(session.subscription_data.trial_end).toBeGreaterThan(Date.now() / 1000);
  });

  it('does not carry a trial that is under 48 hours from ending', async () => {
    (account as any).subscription.trial_ends_at = new Date(Date.now() + 3_600_000).toISOString();
    await checkout(post({ plan: 'pro' }));
    expect(checkoutCreate.mock.calls[0][0].subscription_data.trial_end).toBeUndefined();
  });

  it('rejects unknown plans, bad seat counts, existing subscriptions and signed-out users', async () => {
    expect((await checkout(post({ plan: 'enterprise' }))).status).toBe(400);
    expect((await checkout(post({ plan: 'team', seats: 0 }))).status).toBe(400);

    (account as any).subscription.stripe_subscription_id = 'sub_1';
    (account as any).subscription.status = 'active';
    expect((await checkout(post({ plan: 'pro' }))).status).toBe(409);

    account = null;
    expect((await checkout(post({ plan: 'pro' }))).status).toBe(401);
    expect(checkoutCreate).not.toHaveBeenCalled();
  });

  it('returns 503 when a plan has no configured price', async () => {
    delete process.env.STRIPE_PRICE_PRO;
    expect((await checkout(post({ plan: 'pro' }))).status).toBe(503);
  });
});
