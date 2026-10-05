'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Coffee, Play, ShieldCheck, X, ArrowLeft, Save, AlertCircle, Crosshair } from 'lucide-react';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import { clockOf, localDate, workWindow } from '../../../lib/day/local';
import { dropBlock } from '../../../lib/day/planner';
import type { PlanBlock, ProposedPlan, SavedPlan } from '../../../lib/day/types';

const CYAN = '#22d3ee';
const pad = (n: number) => String(n).padStart(2, '0');
const minutesBetween = (b: PlanBlock) => Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);

const KIND: Record<PlanBlock['kind'], { color: string; label: string; Icon: typeof Play }> = {
  mission: { color: GOLD, label: 'MISSION', Icon: Play },
  buffer: { color: CYAN, label: 'BUFFER', Icon: ShieldCheck },
  break: { color: GREEN, label: 'BREAK', Icon: Coffee },
};

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

function BlockRow({ block, index, last, now, onDrop }: { block: PlanBlock; index: number; last: boolean; now: number; onDrop?: () => void }) {
  const start = Date.parse(block.start);
  const end = Date.parse(block.end);
  const current = start <= now && now < end;
  const past = end <= now;
  const k = KIND[block.kind];
  const mins = minutesBetween(block);
  const isMission = block.kind === 'mission';
  const progress = current ? (now - start) / (end - start) : past ? 1 : 0;

  return (
    <li className="relative flex gap-4" aria-current={current ? 'time' : undefined}>
      {/* Time column */}
      <div className="w-[4.5rem] shrink-0 flex flex-col items-end pt-3 font-tactical tabular-nums">
        <span className={`text-[12px] font-semibold ${current ? 'text-[#c9a84c]' : past ? 'text-[#4a4d5a]' : 'text-[#b8b4ac]'}`}>{clockOf(block.start)}</span>
        <span className="text-[9px] text-[#4a4d5a]">{clockOf(block.end)}</span>
      </div>

      {/* Rail */}
      <div className="relative w-4 shrink-0 flex justify-center">
        <span aria-hidden className="absolute top-0 bottom-0 w-px" style={{ background: last ? `linear-gradient(180deg, ${past || current ? k.color + '66' : '#1e2030'}, transparent)` : past ? k.color + '55' : '#1e2030' }} />
        <span
          aria-hidden
          className={`relative mt-[15px] w-2.5 h-2.5 rounded-full ${current ? 'hud-pulse-gold' : ''}`}
          style={{
            background: past || current ? k.color : '#0a0b10',
            boxShadow: current ? `0 0 10px ${k.color}` : 'none',
            border: `1.5px solid ${past || current ? k.color : '#2a2d3a'}`,
          }}
        />
      </div>

      {/* Block */}
      <div
        className={`relative flex-1 min-w-0 flex items-center gap-3 px-4 py-3 mb-2 rounded-md transition-all ${past ? 'opacity-50' : ''}`}
        style={{
          background: isMission ? 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)' : 'rgba(10,11,16,0.6)',
          border: `1px solid ${current ? k.color + '66' : isMission ? '#1e2030' : '#16182a'}`,
          boxShadow: current ? `0 0 24px ${k.color}1a, inset 0 1px 0 ${k.color}22` : 'none',
        }}
      >
        {current && <CornerBrackets color={k.color + 'aa'} size={10} />}
        {current && (
          <span aria-hidden className="absolute left-0 right-0 bottom-0 h-px overflow-hidden rounded-b-md">
            <span className="block h-full" style={{ width: `${progress * 100}%`, background: k.color, boxShadow: `0 0 6px ${k.color}` }} />
          </span>
        )}
        <span className="font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a] w-6 shrink-0">{pad(index + 1)}</span>
        <k.Icon size={13} className="shrink-0" style={{ color: isMission ? '#8a8d9a' : k.color + 'aa' }} />
        <span className={`flex-1 min-w-0 truncate ${isMission ? 'text-[14.5px] font-semibold text-[#e0dcd2]' : 'text-[13px] text-[#8a8d9a]'}`}>
          {block.title}
        </span>
        <span className="font-tactical text-[9px] tracking-[0.14em] shrink-0 hidden sm:inline" style={{ color: k.color + '99' }}>{k.label}</span>
        <span className="font-tactical text-[11px] tabular-nums text-[#6b6e7a] shrink-0 w-10 text-right">{formatMinutes(mins).toUpperCase()}</span>
        {isMission && block.missionId && !onDrop && (
          <a
            href={`/focus?mission=${block.missionId}`}
            className="font-tactical inline-flex items-center gap-1 px-2 min-h-[30px] rounded text-[10px] tracking-[0.12em] text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors shrink-0"
          >
            <Crosshair size={11} /> FOCUS
          </a>
        )}
        {onDrop && (
          <button type="button" aria-label={`Leave out ${block.title}`} onClick={onDrop} className="text-[#4a4d5a] hover:text-red-400 shrink-0 min-w-[30px] min-h-[30px] flex items-center justify-center">
            <X size={13} />
          </button>
        )}
      </div>
    </li>
  );
}

function PlanList({ blocks, label, onDrop }: { blocks: PlanBlock[]; label: string; onDrop?: (i: number) => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <ol aria-label={label} className="flex flex-col">
      {blocks.map((b, i) => (
        <BlockRow key={`${b.start}-${i}`} block={b} index={i} last={i === blocks.length - 1} now={now} onDrop={onDrop && b.kind === 'mission' ? () => onDrop(i) : undefined} />
      ))}
    </ol>
  );
}

function PlanStats({ blocks }: { blocks: PlanBlock[] }) {
  const missions = blocks.filter((b) => b.kind === 'mission');
  const total = blocks.reduce((n, b) => n + minutesBetween(b), 0);
  const focus = missions.reduce((n, b) => n + minutesBetween(b), 0);
  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a]">
      <span><span className="text-[#e0dcd2]">{pad(missions.length)}</span> MISSIONS</span>
      <span className="text-[#1e2030]">·</span>
      <span><span className="text-[#c9a84c]">{formatMinutes(focus).toUpperCase()}</span> FOCUS</span>
      <span className="text-[#1e2030]">·</span>
      <span><span className="text-[#b8b4ac]">{formatMinutes(total).toUpperCase()}</span> SPAN</span>
      {first && last && (
        <>
          <span className="text-[#1e2030]">·</span>
          <span className="tabular-nums">{clockOf(first.start)} → {clockOf(last.end)}</span>
        </>
      )}
    </div>
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

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  const TIME_FIELD = 'px-3 min-h-[40px] bg-[#08090e] border border-[#1e2030] rounded-md font-tactical text-[14px] tabular-nums text-[#e0dcd2] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors [color-scheme:dark]';

  return (
    <div className="relative flex flex-col gap-5 max-w-3xl">
      <Backdrop />

      <PageHeader
        eyebrow="DAY PLAN"
        title="Timeline"
        aside={<span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">{dateLabel}</span>}
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">Your open missions laid out across the day, with buffers sized from how you actually work.</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {saved === undefined && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// INITIALIZING</span>}

      {/* ── Saved plan ── */}
      {saved && !proposal && (
        <>
          <SectionLabel>TODAY&apos;S PLAN</SectionLabel>
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#1e2030]">
              <PlanStats blocks={saved.blocks} />
              <span className="inline-flex items-center gap-2 font-tactical text-[10px] tracking-[0.16em] text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 hud-pulse-green" />
                {saved.approvedAt ? 'LOCKED IN' : 'SAVED'}
              </span>
            </div>
            <div className="px-5 pt-4 pb-3">
              <PlanList blocks={saved.blocks} label="Today's plan" />
            </div>
          </Panel>
        </>
      )}

      {/* ── Planner ── */}
      {saved !== undefined && !proposal && (
        <>
          <SectionLabel>{saved ? 'RE-PLAN' : 'PLAN THE DAY'}</SectionLabel>
          <Panel>
            <form onSubmit={propose} className="flex flex-wrap items-end gap-4 px-5 py-5">
              <div className="flex items-center gap-2 text-[#c9a84c] mr-2">
                <CalendarClock size={16} />
                <span className="font-tactical text-[10px] tracking-[0.18em] text-[#6b6e7a]">WORK WINDOW</span>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">FROM</span>
                <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} required className={TIME_FIELD} />
              </label>
              <span className="font-tactical text-[#2a2d3a] pb-3">→</span>
              <label className="flex flex-col gap-1.5">
                <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">TO</span>
                <input type="time" value={to} onChange={(e) => setTo(e.target.value)} required className={TIME_FIELD} />
              </label>
              <div className="ml-auto">
                <TacButton type="submit" disabled={busy !== null}>
                  <CalendarClock size={13} /> {busy === 'propose' ? 'PLANNING…' : saved ? 'NEW PLAN' : 'PLAN MY DAY'}
                </TacButton>
              </div>
            </form>
            {saved && (
              <p className="px-5 pb-4 -mt-2 font-tactical text-[9px] tracking-[0.14em] text-[#2f3240]">A NEW PLAN REPLACES TODAY&apos;S ONCE SAVED</p>
            )}
          </Panel>
        </>
      )}

      {/* ── Proposal ── */}
      {proposal && (
        <>
          <SectionLabel>PROPOSED PLAN</SectionLabel>
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#1e2030]">
              <PlanStats blocks={proposal.blocks} />
              <div className="flex gap-2">
                <TacButton variant="ghost" onClick={() => setProposal(null)} disabled={busy !== null}>
                  <ArrowLeft size={12} /> BACK
                </TacButton>
                <TacButton onClick={save} disabled={!proposal.blocks.length || busy !== null}>
                  <Save size={12} /> {busy === 'save' ? 'SAVING…' : 'COMMIT PLAN'}
                </TacButton>
              </div>
            </div>
            <p className="px-5 pt-3 text-[13px] text-[#8a8d9a]">
              <span className="font-tactical text-[9px] tracking-[0.16em] text-[#c9a84c] mr-2">RATIONALE</span>
              {proposal.reason}
              {proposal.bufferScale !== 1 && (
                <span className="font-tactical text-[9px] tracking-[0.12em] text-[#4a4d5a] ml-2">· BUFFERS ×{proposal.bufferScale.toFixed(2)}</span>
              )}
            </p>
            {proposal.blocks.length > 0 && (
              <div className="px-5 pt-4 pb-3">
                <PlanList blocks={proposal.blocks} label="Proposed plan" onDrop={(i) => setProposal({ ...proposal, blocks: dropBlock(proposal.blocks, i) })} />
              </div>
            )}
          </Panel>

          {proposal.unscheduled.length > 0 && (
            <div
              className="relative rounded-lg overflow-hidden px-5 py-4"
              style={{ background: 'linear-gradient(160deg, rgba(107,110,122,0.05), transparent)', border: '1px solid #1e2030' }}
            >
              <CornerBrackets color="rgba(107,110,122,0.4)" size={12} />
              <div className="font-tactical text-[9px] tracking-[0.2em] text-[#6b6e7a] mb-2">
                DID NOT FIT · {pad(proposal.unscheduled.length)}
              </div>
              <ul className="flex flex-col gap-1">
                {proposal.unscheduled.map((m) => (
                  <li key={m.missionId} className="flex items-center gap-3 text-[13px] text-[#8a8d9a]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2a2d3a] shrink-0" />
                    <span className="flex-1 truncate">{m.title}</span>
                    <span className="font-tactical text-[10px] tabular-nums text-[#4a4d5a]">{formatMinutes(m.minutes).toUpperCase()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
