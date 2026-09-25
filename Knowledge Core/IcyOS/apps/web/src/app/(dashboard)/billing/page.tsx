'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { apiFetch } from '../../../lib/api/client';

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

function describe(status: BillingStatus): string {
  if (status.status === 'trialing' && status.trialDaysLeft > 0 && !status.plan) {
    return `Free trial: ${status.trialDaysLeft} day${status.trialDaysLeft === 1 ? '' : 's'} left.`;
  }
  if (!status.hasAccess) return 'Your trial has ended. Choose a plan to keep using IcyOS.';
  if (status.status === 'past_due') return 'Your last payment failed. Update your card to avoid losing access.';
  const renews = status.currentPeriodEnd ? new Date(status.currentPeriodEnd).toLocaleDateString() : null;
  if (status.cancelAtPeriodEnd && renews) return `Cancels on ${renews}.`;
  return renews ? `Renews on ${renews}.` : 'Subscription active.';
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [seats, setSeats] = useState(2);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<BillingStatus>('/api/billing/status').then((res) => {
      if (res.success) setStatus(res.data);
      else setError(res.error?.message ?? 'Could not load billing status');
    });
  }, []);

  async function redirectTo(endpoint: string, body: object, key: string) {
    setBusy(key);
    setError(null);
    const res = await apiFetch<{ url: string }>(endpoint, { method: 'POST', body: JSON.stringify(body) });
    const url = res.success ? res.data?.url : null;
    if (url) {
      window.location.href = url;
    } else {
      setError(res.error?.message ?? 'Something went wrong');
      setBusy(null);
    }
  }

  const subscribed = Boolean(status?.plan) && status?.status !== 'canceled';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Billing</h1>
          <p className="text-zinc-500 text-sm">{status ? describe(status) : 'Loading…'}</p>
        </div>
        {status?.plan && <Badge>{status.plan}</Badge>}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {status && subscribed && (
        <Card className="flex items-center justify-between gap-4">
          <span className="text-sm text-zinc-300">
            Change plan or seats, update your card, download invoices, or cancel.
          </span>
          <Button disabled={busy !== null} onClick={() => redirectTo('/api/billing/portal', {}, 'portal')}>
            {busy === 'portal' ? 'Opening…' : 'Manage subscription'}
          </Button>
        </Card>
      )}

      {status && !subscribed && (
        <div className="grid gap-4 md:grid-cols-3">
          {status.plans.map((p) => (
            <Card key={p.plan} className="flex flex-col gap-4">
              <span className="text-lg font-semibold text-zinc-100">{p.name}</span>
              {p.perSeat && (
                <label className="flex items-center gap-2 text-sm text-zinc-400">
                  Seats
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={seats}
                    onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100"
                  />
                </label>
              )}
              <Button
                disabled={busy !== null}
                onClick={() =>
                  redirectTo('/api/billing/checkout', p.perSeat ? { plan: p.plan, seats } : { plan: p.plan }, p.plan)
                }
              >
                {busy === p.plan ? 'Opening checkout…' : `Choose ${p.name}`}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
