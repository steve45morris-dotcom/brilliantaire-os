import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { isPlan, planForPriceId, priceIdFor, quantityFor } from './plans';
import { hasAccess, trialDaysLeft } from './entitlement';
import { subscriptionRowFromStripe } from './sync';
import { requiresSubscription, billingEnforced } from './gate';
import { handleStripeEvent } from './webhook';

const ENV = { STRIPE_PRICE_STARTER: 'price_s', STRIPE_PRICE_PRO: 'price_p', STRIPE_PRICE_TEAM: 'price_t' };
const NOW = Date.parse('2026-09-24T12:00:00Z');
const DAY = 86_400_000;

function stripeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    status: 'active',
    trial_end: null,
    cancel_at_period_end: false,
    metadata: { user_id: 'user-1' },
    items: { data: [{ price: { id: 'price_t' }, quantity: 5, current_period_end: NOW / 1000 + 30 * 86_400 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe('plans', () => {
  it('maps plans to configured Stripe prices and back', () => {
    expect(priceIdFor('pro', ENV)).toBe('price_p');
    expect(priceIdFor('pro', {})).toBeNull();
    expect(planForPriceId('price_t', ENV)).toBe('team');
    expect(planForPriceId('price_unknown', ENV)).toBeNull();
    expect(isPlan('team')).toBe(true);
    expect(isPlan('enterprise')).toBe(false);
  });

  it('bills seats only on the per-seat plan, within bounds', () => {
    expect(quantityFor('starter', 9)).toBe(1);
    expect(quantityFor('team', undefined)).toBe(1);
    expect(quantityFor('team', 12)).toBe(12);
    expect(quantityFor('team', 0)).toBeNull();
    expect(quantityFor('team', 2.5)).toBeNull();
    expect(quantityFor('team', 501)).toBeNull();
  });
});

describe('entitlement', () => {
  const trial = (offset: number) => ({ status: 'trialing', trial_ends_at: new Date(NOW + offset).toISOString() });

  it('grants access to active, past_due and unexpired trials only', () => {
    expect(hasAccess({ status: 'active', trial_ends_at: null }, NOW)).toBe(true);
    expect(hasAccess({ status: 'past_due', trial_ends_at: null }, NOW)).toBe(true);
    expect(hasAccess(trial(DAY), NOW)).toBe(true);
    expect(hasAccess(trial(-1), NOW)).toBe(false);
    expect(hasAccess({ status: 'trialing', trial_ends_at: null }, NOW)).toBe(false);
    for (const status of ['canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused']) {
      expect(hasAccess({ status, trial_ends_at: null }, NOW)).toBe(false);
    }
    expect(hasAccess(null, NOW)).toBe(false);
  });

  it('counts trial days left, rounding up', () => {
    expect(trialDaysLeft(trial(13.2 * DAY), NOW)).toBe(14);
    expect(trialDaysLeft(trial(-DAY), NOW)).toBe(0);
    expect(trialDaysLeft({ status: 'active', trial_ends_at: null }, NOW)).toBe(0);
  });
});

describe('subscriptionRowFromStripe', () => {
  it('stores plan, seats and the item-level billing period', () => {
    const row = subscriptionRowFromStripe(stripeSubscription({ trial_end: NOW / 1000 }), ENV, new Date(NOW));
    expect(row).toEqual({
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_1',
      plan: 'team',
      status: 'active',
      seats: 5,
      trial_ends_at: new Date(NOW).toISOString(),
      current_period_end: new Date(NOW + 30 * DAY).toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date(NOW).toISOString(),
    });
  });

  it('accepts an expanded customer object', () => {
    const row = subscriptionRowFromStripe(stripeSubscription({ customer: { id: 'cus_9' } as Stripe.Customer }), ENV);
    expect(row.stripe_customer_id).toBe('cus_9');
  });
});

describe('gate', () => {
  it('exempts everything a locked-out user needs to subscribe', () => {
    for (const path of ['/billing', '/api/billing/checkout', '/api/billing/webhook', '/api/health', '/login', '/auth/callback']) {
      expect(requiresSubscription(path)).toBe(false);
    }
    for (const path of ['/', '/dashboard', '/billingx', '/api/missions/create']) {
      expect(requiresSubscription(path)).toBe(true);
    }
    expect(billingEnforced({})).toBe(true);
    expect(billingEnforced({ BILLING_ENFORCEMENT: 'off' })).toBe(false);
  });
});

// A chainable stand-in for the service-role Supabase client.
function fakeDb(state: { seenEvent?: boolean; userByCustomer?: string | null } = {}) {
  const upserts: { table: string; row: Record<string, unknown> }[] = [];
  const db = {
    upserts,
    from(table: string) {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (table === 'billing_events') return { data: state.seenEvent ? { stripe_event_id: 'evt' } : null };
              return { data: state.userByCustomer ? { user_id: state.userByCustomer } : null };
            },
          }),
        }),
        upsert: async (row: Record<string, unknown>) => {
          upserts.push({ table, row });
          return { error: null };
        },
      };
    },
  };
  return db;
}

function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: 'evt_1', type, data: { object } } as unknown as Stripe.Event;
}

describe('handleStripeEvent', () => {
  it('re-fetches the subscription and upserts it for the user in its metadata', async () => {
    const retrieve = vi.fn().mockResolvedValue(stripeSubscription());
    const db = fakeDb();
    const outcome = await handleStripeEvent(
      event('customer.subscription.updated', { object: 'subscription', id: 'sub_1', status: 'incomplete' }),
      { subscriptions: { retrieve } } as unknown as Stripe,
      db as never,
      ENV
    );

    expect(outcome).toBe('processed');
    expect(retrieve).toHaveBeenCalledWith('sub_1');
    expect(db.upserts[0]).toMatchObject({ table: 'subscriptions', row: { user_id: 'user-1', plan: 'team', status: 'active', seats: 5 } });
    expect(db.upserts[1]).toMatchObject({ table: 'billing_events', row: { stripe_event_id: 'evt_1' } });
  });

  it('resolves the subscription from a completed checkout session', async () => {
    const retrieve = vi.fn().mockResolvedValue(stripeSubscription());
    await handleStripeEvent(
      event('checkout.session.completed', { object: 'checkout.session', subscription: 'sub_1' }),
      { subscriptions: { retrieve } } as unknown as Stripe,
      fakeDb() as never,
      ENV
    );
    expect(retrieve).toHaveBeenCalledWith('sub_1');
  });

  it('falls back to the stored customer id when metadata has no user', async () => {
    const retrieve = vi.fn().mockResolvedValue(stripeSubscription({ metadata: {} }));
    const db = fakeDb({ userByCustomer: 'user-7' });
    await handleStripeEvent(
      event('customer.subscription.created', { object: 'subscription', id: 'sub_1' }),
      { subscriptions: { retrieve } } as unknown as Stripe,
      db as never,
      ENV
    );
    expect(db.upserts[0].row.user_id).toBe('user-7');
  });

  it('fails without recording the event when no user matches, so Stripe retries', async () => {
    const retrieve = vi.fn().mockResolvedValue(stripeSubscription({ metadata: {} }));
    const db = fakeDb({ userByCustomer: null });
    await expect(
      handleStripeEvent(
        event('customer.subscription.created', { object: 'subscription', id: 'sub_1' }),
        { subscriptions: { retrieve } } as unknown as Stripe,
        db as never,
        ENV
      )
    ).rejects.toThrow('No IcyOS user');
    expect(db.upserts).toHaveLength(0);
  });

  it('skips duplicates and ignores unrelated events', async () => {
    const retrieve = vi.fn();
    const stripe = { subscriptions: { retrieve } } as unknown as Stripe;
    expect(await handleStripeEvent(event('customer.subscription.updated', { object: 'subscription', id: 'sub_1' }), stripe, fakeDb({ seenEvent: true }) as never, ENV)).toBe('duplicate');
    expect(await handleStripeEvent(event('invoice.created', { object: 'invoice' }), stripe, fakeDb() as never, ENV)).toBe('ignored');
    expect(retrieve).not.toHaveBeenCalled();
  });
});
