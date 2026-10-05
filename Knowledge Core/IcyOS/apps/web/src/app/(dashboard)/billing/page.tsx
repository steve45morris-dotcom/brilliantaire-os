'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, CreditCard, Users, Check } from 'lucide-react';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';

const AMBER = '#fbbf24';
const RED = '#f87171';
const pad = (n: number) => String(n).padStart(2, '0');

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

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

function describe(status: BillingStatus): { headline: string; tone: string; label: string } {
  if (status.status === 'trialing' && status.trialDaysLeft > 0 && !status.plan) {
    return { headline: `Free trial · ${status.trialDaysLeft} day${status.trialDaysLeft === 1 ? '' : 's'} left.`, tone: AMBER, label: 'TRIAL' };
  }
  if (!status.hasAccess) return { headline: 'Your trial has ended. Choose a plan to keep using IcyOS.', tone: RED, label: 'LAPSED' };
  if (status.status === 'past_due') return { headline: 'Your last payment failed. Update your card to avoid losing access.', tone: RED, label: 'PAST DUE' };
  const renews = status.currentPeriodEnd ? fmt(status.currentPeriodEnd) : null;
  if (status.cancelAtPeriodEnd && renews) return { headline: `Cancels on ${renews}.`, tone: AMBER, label: 'CANCELLING' };
  return { headline: renews ? `Renews on ${renews}.` : 'Subscription active.', tone: GREEN, label: 'ACTIVE' };
}

function Panel({ children, className = '', accent = 'rgba(201,168,76,0.55)' }: { children: React.ReactNode; className?: string; accent?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color={accent} size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      {children}
    </div>
  );
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
  const d = status ? describe(status) : null;

  return (
    <div className="relative flex flex-col gap-5 max-w-4xl">
      <Backdrop />

      <PageHeader
        eyebrow="ACCOUNT"
        title="Billing"
        aside={
          d && (
            <span className="inline-flex items-center gap-2 font-tactical text-[10px] tracking-[0.18em] px-3 py-1.5 rounded-md" style={{ color: d.tone, background: `${d.tone}14`, boxShadow: `inset 0 0 0 1px ${d.tone}55` }}>
              <span className={`w-1.5 h-1.5 rounded-full ${d.tone === GREEN ? 'hud-pulse-green' : ''}`} style={{ background: d.tone, boxShadow: `0 0 6px ${d.tone}` }} />
              {d.label}{status?.plan ? ` · ${status.plan.toUpperCase()}` : ''}
            </span>
          )
        }
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">{d ? d.headline : 'Loading…'}</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!status && !error && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// INITIALIZING</span>}

      {/* ── Subscribed ── */}
      {status && subscribed && (
        <>
          <SectionLabel>SUBSCRIPTION</SectionLabel>
          <Panel accent={d ? `${d.tone}88` : undefined}>
            <div className="flex flex-wrap items-center gap-6 px-5 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 flex-1 font-tactical">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">PLAN</span>
                  <span className="text-[18px] leading-none font-semibold text-[#e0dcd2]">{status.plan?.toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">SEATS</span>
                  <span className="text-[18px] leading-none font-semibold tabular-nums" style={{ color: GOLD }}>{pad(status.seats)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">STATUS</span>
                  <span className="text-[13px] leading-none font-semibold tracking-[0.1em]" style={{ color: d?.tone }}>{d?.label}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">{status.cancelAtPeriodEnd ? 'ENDS' : 'RENEWS'}</span>
                  <span className="text-[13px] leading-none font-semibold text-[#b8b4ac] tabular-nums">{status.currentPeriodEnd ? fmt(status.currentPeriodEnd) : '—'}</span>
                </div>
              </div>
              <TacButton disabled={busy !== null} onClick={() => redirectTo('/api/billing/portal', {}, 'portal')}>
                <ExternalLink size={12} /> {busy === 'portal' ? 'OPENING…' : 'MANAGE'}
              </TacButton>
            </div>
            <p className="px-5 pb-4 -mt-1 text-[12px] text-[#6b6e7a]">Change plan or seats, update your card, download invoices, or cancel — all in the Stripe portal.</p>
          </Panel>
        </>
      )}

      {/* ── Plans ── */}
      {status && !subscribed && (
        <>
          <SectionLabel>SELECT A PLAN</SectionLabel>
          <div className="grid gap-3 md:grid-cols-3">
            {status.plans.map((p, i) => {
              const featured = i === 1 || status.plans.length === 1;
              return (
                <div
                  key={p.plan}
                  className="relative flex flex-col gap-4 px-5 pt-5 pb-5 rounded-lg overflow-hidden"
                  style={{
                    background: featured ? 'linear-gradient(180deg, #15161f 0%, #0e0f16 100%)' : 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)',
                    border: `1px solid ${featured ? 'rgba(201,168,76,0.45)' : '#1e2030'}`,
                    boxShadow: featured ? '0 0 0 1px rgba(201,168,76,0.12), 0 0 34px rgba(201,168,76,0.1), inset 0 1px 0 rgba(201,168,76,0.14)' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                  }}
                >
                  {featured && <CornerBrackets color="rgba(201,168,76,0.75)" size={12} />}
                  {featured && <span aria-hidden className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.85), transparent)' }} />}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">TIER {pad(i + 1)}</span>
                      <span className="text-[19px] font-semibold text-[#ece8de] leading-tight">{p.name}</span>
                    </div>
                    <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ color: featured ? GOLD : '#6b6e7a', background: featured ? 'rgba(201,168,76,0.1)' : 'rgba(30,32,48,0.6)', boxShadow: `inset 0 0 0 1px ${featured ? 'rgba(201,168,76,0.3)' : '#1e2030'}` }}>
                      {p.perSeat ? <Users size={15} /> : <CreditCard size={15} />}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1.5 font-tactical text-[10px] tracking-[0.1em] text-[#8a8d9a]">
                    <li className="flex items-center gap-2"><Check size={11} style={{ color: GREEN }} /> MONTHLY · CANCEL ANYTIME</li>
                    <li className="flex items-center gap-2"><Check size={11} style={{ color: GREEN }} /> {p.perSeat ? 'BILLED PER SEAT' : 'SINGLE OPERATOR'}</li>
                    <li className="flex items-center gap-2"><Check size={11} style={{ color: GREEN }} /> ACCESS TO PERIOD END</li>
                  </ul>
                  {p.perSeat && (
                    <label className="flex items-center justify-between gap-3 pt-3 border-t border-[#1e2030]">
                      <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">SEATS</span>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={seats}
                        onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
                        className="w-20 px-2 min-h-[36px] bg-[#08090e] border border-[#1e2030] rounded-md font-tactical text-[13px] tabular-nums text-[#e0dcd2] text-right focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                      />
                    </label>
                  )}
                  <div className={p.perSeat ? '' : 'mt-auto pt-3 border-t border-[#1e2030]'}>
                    <TacButton
                      variant={featured ? 'gold' : 'ghost'}
                      className="w-full"
                      disabled={busy !== null}
                      onClick={() => redirectTo('/api/billing/checkout', p.perSeat ? { plan: p.plan, seats } : { plan: p.plan }, p.plan)}
                    >
                      {busy === p.plan ? 'OPENING CHECKOUT…' : `CHOOSE ${p.name.toUpperCase()}`}
                    </TacButton>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[12px] text-[#4a4d5a] leading-relaxed">
            Plans renew monthly until you cancel. Cancel anytime; access continues to the end of the paid period, with no partial refunds. By subscribing you agree to the{' '}
            <a href="/terms" className="text-[#8a8d9a] underline decoration-[#2a2d3a] hover:text-[#c9a84c]">Terms of Service</a> and{' '}
            <a href="/privacy" className="text-[#8a8d9a] underline decoration-[#2a2d3a] hover:text-[#c9a84c]">Privacy Policy</a>.
          </p>
        </>
      )}
    </div>
  );
}
