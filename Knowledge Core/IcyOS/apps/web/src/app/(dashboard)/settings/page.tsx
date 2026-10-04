'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Copy, CreditCard, KeyRound } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Spinner } from '../../../components/ui/spinner';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { apiFetch } from '../../../lib/api/client';
import type { ApiTokenRow, CreatedApiToken } from '../../../lib/auth/token-routes';

const EXPIRY_OPTIONS: { label: string; days: number | null }[] = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
  { label: 'Never', days: null },
];

const formatDate = (iso: string | null, fallback: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : fallback;

function expiryText(token: ApiTokenRow): { text: string; expired: boolean } {
  if (!token.expires_at) return { text: 'Never expires', expired: false };
  const expired = new Date(token.expires_at).getTime() <= Date.now();
  return { text: `${expired ? 'Expired' : 'Expires'} ${formatDate(token.expires_at, '')}`, expired };
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="text-zinc-500 text-sm">Account and connections.</p>
      </div>

      <Link href="/billing" className="group">
        <Card className="flex items-center justify-between gap-3 !py-4 group-hover:border-zinc-700 transition-colors">
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <CreditCard size={18} /> Plan and billing
          </span>
          <ChevronRight size={18} className="text-zinc-500" />
        </Card>
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <KeyRound size={18} /> Personal access tokens
          </h2>
          <p className="text-sm text-zinc-400">
            Let your own tools and assistants read and change your projects, missions and steps. A token can’t see
            billing or settings, or create other tokens. Send it as <code className="text-zinc-300">Authorization: Bearer &lt;token&gt;</code>.
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {created && (
          <div className="flex flex-col gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <span className="text-sm font-semibold text-emerald-300">
              Copy “{created.name}” now. You won’t be able to see it again.
            </span>
            <div className="flex gap-2">
              <input
                readOnly
                aria-label="New token"
                value={created.token}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md font-mono text-xs text-zinc-100"
              />
              <Button variant="secondary" className="inline-flex items-center gap-1.5" onClick={() => copy(created.token)}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <span className="text-xs text-zinc-500">Store it somewhere safe, like a password manager or your tool’s secret settings.</span>
            <button type="button" onClick={() => setCreated(null)} className="self-start text-xs text-zinc-400 hover:text-zinc-200 underline">
              I’ve saved it
            </button>
          </div>
        )}

        <form onSubmit={create} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            aria-label="Token name"
            placeholder="Name, e.g. P.J.K. on my Mac"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
          />
          <select
            aria-label="Token expiry"
            value={expiry === null ? 'never' : String(expiry)}
            onChange={(e) => setExpiry(e.target.value === 'never' ? null : Number(e.target.value))}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-200 focus:outline-none focus:border-pink-500"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.label} value={o.days === null ? 'never' : String(o.days)}>
                Expires: {o.label}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={!name.trim() || creating}>
            {creating ? 'Creating…' : 'Create token'}
          </Button>
        </form>

        {tokens === null && !error && <Spinner />}
        {tokens && tokens.length === 0 && <p className="text-sm text-zinc-500">No tokens yet.</p>}
        {tokens && tokens.length > 0 && (
          <ul className="flex flex-col divide-y divide-zinc-800 border-t border-zinc-800">
            {tokens.map((t) => {
              const expiryInfo = expiryText(t);
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-zinc-100 break-words">{t.name}</span>
                    <span className="text-xs text-zinc-500">
                      <code className="text-zinc-400">{t.prefix}…</code> · Created {formatDate(t.created_at, '')} · Last used{' '}
                      {formatDate(t.last_used_at, 'never')} ·{' '}
                      <span className={expiryInfo.expired ? 'text-red-400' : ''}>{expiryInfo.text}</span>
                    </span>
                  </div>
                  <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => revoke(t)}>
                    Revoke
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
