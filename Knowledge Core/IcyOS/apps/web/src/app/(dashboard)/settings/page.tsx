'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Copy, CreditCard, KeyRound, AlertCircle, Plus, ShieldAlert } from 'lucide-react';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import type { ApiTokenRow, CreatedApiToken } from '../../../lib/auth/token-routes';

const pad = (n: number) => String(n).padStart(2, '0');

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'NEVER', days: null },
];

const formatDate = (iso: string | null, fallback: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase() : fallback;

function expiryText(token: ApiTokenRow): { text: string; expired: boolean } {
  if (!token.expires_at) return { text: 'NO EXPIRY', expired: false };
  const expired = new Date(token.expires_at).getTime() <= Date.now();
  return { text: `${expired ? 'EXPIRED' : 'EXPIRES'} ${formatDate(token.expires_at, '')}`, expired };
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<ApiTokenRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState<number | null>(365);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState<PendingDelete | null>(null);

  const refresh = useCallback(async () => {
    const res = await apiFetch<ApiTokenRow[]>('/api/tokens');
    if (res.success && res.data) setTokens(res.data);
    else setError(res.error?.message ?? 'Could not load your tokens');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    setCopied(false);
    const res = await apiFetch<CreatedApiToken>('/api/tokens', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim(), expiresInDays: expiry }),
    });
    setCreating(false);
    if (res.success && res.data) {
      setCreated(res.data);
      setName('');
      await refresh();
    } else {
      setError(res.error?.message ?? 'Could not create the token');
    }
  }

  async function copy(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
    } catch {
      setError('Copying failed. Select the token and copy it by hand.');
    }
  }

  function revoke(token: ApiTokenRow) {
    setConfirming({
      title: `Revoke “${token.name}”?`,
      message: 'Anything using this token stops working straight away. This can’t be undone.',
      confirmLabel: 'Revoke',
      run: async () => {
        setError(null);
        const res = await apiFetch(`/api/tokens/${token.id}`, { method: 'DELETE' });
        if (!res.success) {
          setError(res.error?.message ?? 'Could not revoke the token');
          return false;
        }
        if (created?.id === token.id) setCreated(null);
        await refresh();
        return true;
      },
    });
  }

  const live = tokens?.filter((t) => !expiryText(t).expired).length ?? 0;

  return (
    <div className="relative flex flex-col gap-5 max-w-3xl">
      <Backdrop />

      <PageHeader
        eyebrow="CONFIGURATION"
        title="Settings"
        aside={tokens && <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">{pad(live)} TOKENS LIVE</span>}
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">Account and connections.</p>

      {/* Billing link */}
      <Link href="/billing" className="group block">
        <div
          className="relative flex items-center justify-between gap-3 px-5 py-4 rounded-lg overflow-hidden transition-all"
          style={{ background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)', border: '1px solid #1e2030' }}
        >
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.3), 0 0 22px rgba(201,168,76,0.06)' }} />
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-md flex items-center justify-center text-[#c9a84c]" style={{ background: 'rgba(201,168,76,0.08)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.25)' }}>
              <CreditCard size={16} />
            </span>
            <span className="flex flex-col">
              <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">ACCOUNT</span>
              <span className="text-[15px] font-semibold text-[#e0dcd2]">Plan and billing</span>
            </span>
          </span>
          <ChevronRight size={16} className="text-[#4a4d5a] group-hover:text-[#c9a84c] group-hover:translate-x-0.5 transition-all" />
        </div>
      </Link>

      {/* Tokens */}
      <SectionLabel>ACCESS TOKENS</SectionLabel>
      <Panel>
        <div className="flex items-start gap-3 px-5 pt-4 pb-4 border-b border-[#1e2030]">
          <span className="w-9 h-9 shrink-0 rounded-md flex items-center justify-center text-[#c9a84c]" style={{ background: 'rgba(201,168,76,0.08)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.25)' }}>
            <KeyRound size={16} />
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-[#e0dcd2]">Personal access tokens</h2>
            <p className="text-[13px] text-[#8a8d9a] leading-relaxed">
              Let your own tools and assistants read and change your projects, missions and steps. A token can’t see billing or settings, or create other tokens. Send it as{' '}
              <code className="font-tactical text-[11px] text-[#c9a84c] bg-[#c9a84c]/10 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p role="alert" className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {created && (
            <div
              className="relative flex flex-col gap-3 rounded-lg px-4 py-4 overflow-hidden"
              style={{ background: 'linear-gradient(160deg, rgba(52,211,153,0.07), transparent)', border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 24px rgba(52,211,153,0.06)' }}
            >
              <CornerBrackets color="rgba(52,211,153,0.6)" size={12} />
              <span className="inline-flex items-center gap-2 font-tactical text-[10px] tracking-[0.16em] text-emerald-300">
                <ShieldAlert size={13} /> TOKEN ISSUED · “{created.name.toUpperCase()}” · SHOWN ONCE
              </span>
              <div className="flex gap-2">
                <input
                  readOnly
                  aria-label="New token"
                  value={created.token}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 px-3 min-h-[38px] bg-[#08090e] border border-[#1e2030] rounded-md font-tactical text-[12px] text-[#e0dcd2] focus:outline-none focus:border-emerald-500/50"
                />
                <TacButton variant="ghost" onClick={() => copy(created.token)}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'COPIED' : 'COPY'}
                </TacButton>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-[#6b6e7a]">Store it somewhere safe, like a password manager or your tool’s secret settings.</span>
                <button type="button" onClick={() => setCreated(null)} className="font-tactical text-[9px] tracking-[0.14em] text-[#8a8d9a] hover:text-[#e0dcd2] shrink-0">
                  I’VE SAVED IT
                </button>
              </div>
            </div>
          )}

          <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 flex flex-col gap-1.5">
              <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">TOKEN NAME</span>
              <input
                aria-label="Token name"
                placeholder="e.g. P.J.K. on my Mac"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 min-h-[40px] bg-[#08090e] border border-[#1e2030] rounded-md text-[13.5px] text-[#e0dcd2] placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">EXPIRY</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Token expiry">
                {EXPIRY_OPTIONS.map((o) => {
                  const on = expiry === o.days;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setExpiry(o.days)}
                      className="font-tactical px-3 min-h-[40px] rounded-md text-[11px] tracking-[0.12em] font-semibold transition-all"
                      style={{ color: on ? '#c9a84c' : '#6b6e7a', background: on ? 'rgba(201,168,76,0.10)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.4)' : 'inset 0 0 0 1px #1e2030' }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <TacButton type="submit" disabled={!name.trim() || creating} className="sm:min-h-[40px]">
              <Plus size={12} /> {creating ? 'ISSUING…' : 'ISSUE'}
            </TacButton>
          </form>

          {tokens === null && !error && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// LOADING</span>}
          {tokens && tokens.length === 0 && (
            <div className="flex items-center justify-center py-8 border border-dashed border-[#1e2030] rounded-lg">
              <span className="font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a]">NO TOKENS ISSUED</span>
            </div>
          )}
          {tokens && tokens.length > 0 && (
            <ul className="flex flex-col border-t border-[#1e2030]">
              {tokens.map((t, i) => {
                const expiryInfo = expiryText(t);
                return (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#1e2030]/60">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${expiryInfo.expired ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ boxShadow: expiryInfo.expired ? 'none' : '0 0 6px rgba(52,211,153,0.6)' }} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a]">T-{pad(i + 1)}</span>
                          <span className="text-[14px] font-semibold text-[#e0dcd2] break-words">{t.name}</span>
                        </span>
                        <span className="font-tactical text-[9px] tracking-[0.1em] text-[#4a4d5a] flex flex-wrap gap-x-2">
                          <span className="text-[#8a8d9a]">{t.prefix}…</span>
                          <span>·</span>
                          <span>ISSUED {formatDate(t.created_at, '')}</span>
                          <span>·</span>
                          <span>USED {formatDate(t.last_used_at, 'NEVER')}</span>
                          <span>·</span>
                          <span className={expiryInfo.expired ? 'text-red-400' : ''}>{expiryInfo.text}</span>
                        </span>
                      </div>
                    </div>
                    <TacButton variant="danger" className="!min-h-[32px] !px-2.5 !text-[10px]" onClick={() => revoke(t)}>
                      REVOKE
                    </TacButton>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
