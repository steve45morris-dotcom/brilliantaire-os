'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { apiFetch } from '../../lib/api/client';

interface BillingStatus {
  plan: string | null;
  status: string | null;
  seats: number;
  hasAccess: boolean;
  trialDaysLeft: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeCustomer: boolean;
  plans: { plan: string; name: string; perSeat: boolean }[];
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past due',
  canceled: 'Canceled',
  unpaid: 'Unpaid',
  paused: 'Paused',
};

const STATUS_COLORS: Record<string, string> = {
  trialing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  past_due: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  canceled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function BillingPage() {
  const params = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const checkout = params.get('checkout');
    if (checkout === 'success') setToast('Subscription activated. Welcome aboard.');
    if (checkout === 'canceled') setToast('Checkout canceled. No charges were made.');
  }, [params]);

  useEffect(() => {
    apiFetch<BillingStatus>('/api/billing/status').then((res) => {
      if (res.success && res.data) setBilling(res.data);
      setLoading(false);
    });
  }, []);

  async function startCheckout(plan: string) {
    setBusy(plan);
    const res = await apiFetch<{ url: string }>('/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setToast(res.error?.message ?? 'Could not start checkout');
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy('portal');
    const res = await apiFetch<{ url: string }>('/api/billing/portal', { method: 'POST' });
    if (res.success && res.data?.url) {
      window.location.href = res.data.url;
    } else {
      setToast(res.error?.message ?? 'Could not open billing portal');
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-zinc-500">Loading billing details...</p>
      </Shell>
    );
  }

  if (!billing) {
    return (
      <Shell>
        <p className="text-sm text-red-400">Failed to load billing information. Please try again.</p>
      </Shell>
    );
  }

  const hasSubscription = billing.status && !['canceled', 'incomplete_expired'].includes(billing.status);
  const statusColor = billing.status ? STATUS_COLORS[billing.status] ?? '' : '';

  return (
    <Shell>
      {toast && (
        <div className="rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-200 flex justify-between items-center">
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-zinc-300 ml-4" aria-label="Dismiss">&times;</button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-100">Billing</h1>
        <p className="text-sm text-zinc-500">Manage your subscription and payment method.</p>
      </div>

      {billing.status && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-300">Current plan</span>
            <Badge className={statusColor}>
              {billing.plan ? `${billing.plan.charAt(0).toUpperCase()}${billing.plan.slice(1)}` : 'None'} &middot; {STATUS_LABELS[billing.status] ?? billing.status}
            </Badge>
          </div>

          {billing.status === 'trialing' && billing.trialDaysLeft > 0 && (
            <p className="text-sm text-zinc-400">
              {billing.trialDaysLeft} day{billing.trialDaysLeft === 1 ? '' : 's'} left in your free trial.
              {' '}Subscribe below to keep access when it ends.
            </p>
          )}

          {billing.currentPeriodEnd && billing.status === 'active' && (
            <p className="text-sm text-zinc-400">
              {billing.cancelAtPeriodEnd
                ? `Access until ${new Date(billing.currentPeriodEnd).toLocaleDateString()}, then your subscription ends.`
                : `Renews ${new Date(billing.currentPeriodEnd).toLocaleDateString()}.`}
            </p>
          )}

          {billing.status === 'past_due' && (
            <p className="text-sm text-amber-400">
              Your last payment failed. Update your card to avoid losing access.
            </p>
          )}

          {billing.seats > 1 && (
            <p className="text-sm text-zinc-400">{billing.seats} seat{billing.seats === 1 ? '' : 's'}</p>
          )}

          {billing.hasStripeCustomer && (
            <Button variant="secondary" disabled={busy === 'portal'} onClick={openPortal}>
              {busy === 'portal' ? 'Opening...' : 'Manage subscription'}
            </Button>
          )}
        </Card>
      )}

      {!hasSubscription && (
        <>
          <h2 className="text-lg font-semibold text-zinc-200 mt-2">Choose a plan</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {billing.plans.map((plan) => (
              <Card key={plan.plan} className="flex flex-col gap-3">
                <span className="text-base font-semibold text-zinc-100">{plan.name}</span>
                {plan.perSeat && <span className="text-xs text-zinc-500">Billed per seat</span>}
                <Button
                  disabled={busy !== null}
                  onClick={() => startCheckout(plan.plan)}
                >
                  {busy === plan.plan ? 'Redirecting...' : `Subscribe to ${plan.name}`}
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-zinc-600 mt-4">
        By subscribing you agree to the <a href="/terms" className="underline hover:text-zinc-400">Terms of Service</a> and <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">{children}</div>
    </div>
  );
}
