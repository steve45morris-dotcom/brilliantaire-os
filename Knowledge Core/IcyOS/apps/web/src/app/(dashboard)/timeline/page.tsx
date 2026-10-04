'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Coffee, Play, ShieldCheck, X } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { apiFetch } from '../../../lib/api/client';
import { clockOf, localDate, workWindow } from '../../../lib/day/local';
import { dropBlock } from '../../../lib/day/planner';
import type { PlanBlock, ProposedPlan, SavedPlan } from '../../../lib/day/types';

const minutesBetween = (b: PlanBlock) => Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);

const BLOCK_STYLE: Record<PlanBlock['kind'], string> = {
  mission: 'border-pink-500/30 bg-pink-500/5',
  buffer: 'border-cyan-500/20 bg-cyan-500/5',
  break: 'border-emerald-500/20 bg-emerald-500/5',
};

function BlockRow({ block, onDrop }: { block: PlanBlock; onDrop?: () => void }) {
  const now = Date.now();
  const current = Date.parse(block.start) <= now && now < Date.parse(block.end);
  const Icon = block.kind === 'mission' ? Play : block.kind === 'break' ? Coffee : ShieldCheck;
  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 rounded-md border ${BLOCK_STYLE[block.kind]} ${current ? 'ring-1 ring-pink-500' : ''}`}
      aria-current={current ? 'time' : undefined}
    >
      <span className="w-24 shrink-0 font-mono text-xs text-zinc-400">
        {clockOf(block.start)}–{clockOf(block.end)}
      </span>
      <Icon size={14} className="shrink-0 text-zinc-500" />
      <span className={`flex-1 min-w-0 truncate text-sm ${block.kind === 'mission' ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>
        {block.title}
      </span>
      <span className="text-xs text-zinc-500 shrink-0">{formatMinutes(minutesBetween(block))}</span>
      {block.kind === 'mission' && block.missionId && !onDrop && (
        <a href={`/focus?mission=${block.missionId}`} className="text-xs text-pink-400 hover:underline shrink-0">
          Focus
        </a>
      )}
      {onDrop && (
        <button type="button" aria-label={`Leave out ${block.title}`} onClick={onDrop} className="text-zinc-500 hover:text-red-400 shrink-0">
          <X size={14} />
        </button>
      )}
    </li>
  );
}

export default function TimelinePage() {
  const [today] = useState(() => localDate());
  const [saved, setSaved] = useState<SavedPlan | null | undefined>(undefined);
  const [proposal, setProposal] = useState<ProposedPlan | null>(null);
  const [from, setFrom] = useState('09:00');
  const [to, setTo] = useState('17:00');
  const [busy, setBusy] = useState<'propose' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<{ plan: SavedPlan | null }>(`/api/timeline?date=${today}`);
    if (res.success && res.data) setSaved(res.data.plan);
    else {
      setSaved(null);
      setError(res.error?.message ?? 'Could not load your plan');
    }
  }, [today]);

  useEffect(() => {
    void load();
  }, [load]);

  async function propose(e: React.FormEvent) {
    e.preventDefault();
    const window = workWindow(today, from, to);
    if (!window) {
      setError('That window has already passed or is too short. Pick a later end time.');
      return;
    }
    setBusy('propose');
    setError(null);
    const res = await apiFetch<ProposedPlan>('/api/timeline/propose', { method: 'POST', body: JSON.stringify({ date: today, ...window }) });
    setBusy(null);
    if (res.success && res.data) setProposal(res.data);
    else setError(res.error?.message ?? 'Could not plan your day');
  }

  async function save() {
    if (!proposal?.blocks.length) return;
    setBusy('save');
    setError(null);
    const res = await apiFetch('/api/timeline/save', { method: 'POST', body: JSON.stringify({ date: today, blocks: proposal.blocks }) });
    setBusy(null);
    if (!res.success) {
      setError(res.error?.message ?? 'Could not save the plan');
      return;
    }
    setProposal(null);
    await load();
  }

  const missionCount = (blocks: PlanBlock[]) => blocks.filter((b) => b.kind === 'mission').length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Timeline</h1>
        <p className="text-zinc-500 text-sm">Your open missions laid out across the day, with buffers sized from how you actually work.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {saved === undefined && <p className="text-sm text-zinc-500">Loading…</p>}

      {saved && !proposal && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-zinc-400">
            Today&apos;s plan · {missionCount(saved.blocks)} {missionCount(saved.blocks) === 1 ? 'mission' : 'missions'}, {clockOf(saved.blocks[0].start)}–{clockOf(saved.blocks[saved.blocks.length - 1].end)}
          </p>
          <ol aria-label="Today's plan" className="flex flex-col gap-2">
            {saved.blocks.map((b, i) => (
              <BlockRow key={`${b.start}-${i}`} block={b} />
            ))}
          </ol>
        </div>
      )}
      {saved !== undefined && !proposal && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold">
            <CalendarClock size={18} /> {saved ? 'Plan again' : 'Plan my day'}
          </div>
          <form onSubmit={propose} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              From
              <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              To
              <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} required />
            </label>
            <Button type="submit" disabled={busy !== null}>
              {busy === 'propose' ? 'Planning…' : saved ? 'Make a new plan' : 'Plan my day'}
            </Button>
          </form>
          {saved && <p className="text-xs text-zinc-600">A new plan replaces today's once you save it.</p>}
        </Card>
      )}

      {proposal && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">{proposal.reason}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setProposal(null)} disabled={busy !== null}>
                Back
              </Button>
              <Button onClick={save} disabled={!proposal.blocks.length || busy !== null}>
                {busy === 'save' ? 'Saving…' : 'Save plan'}
              </Button>
            </div>
          </div>
          {proposal.blocks.length > 0 && (
            <ol aria-label="Proposed plan" className="flex flex-col gap-2">
              {proposal.blocks.map((b, i) => (
                <BlockRow
                  key={`${b.start}-${i}`}
                  block={b}
                  onDrop={b.kind === 'mission' ? () => setProposal({ ...proposal, blocks: dropBlock(proposal.blocks, i) }) : undefined}
                />
              ))}
            </ol>
          )}
          {proposal.unscheduled.length > 0 && (
            <Card className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-zinc-300">Didn&apos;t fit today</span>
              <ul className="flex flex-col gap-1">
                {proposal.unscheduled.map((m) => (
                  <li key={m.missionId} className="text-sm text-zinc-500">
                    {m.title} · {formatMinutes(m.minutes)}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

    </div>
  );
}
