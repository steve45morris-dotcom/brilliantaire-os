'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, Coffee, Crosshair, Play, Save, ShieldCheck, X } from 'lucide-react';
import { Words } from '../../../components/daylight/command-hero';
import { tiltHandlers } from '../../../components/daylight/daylight-fx';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { formatMinutes } from '../../../lib/inbox/review';
import { apiFetch } from '../../../lib/api/client';
import { clockOf, localDate, workWindow } from '../../../lib/day/local';
import { dropBlock } from '../../../lib/day/planner';
import { ribbonOf, summarise } from '../../../lib/day/ribbon';
import type { PlanBlock, ProposedPlan, SavedPlan } from '../../../lib/day/types';

const pad = (n: number) => String(n).padStart(2, '0');
const minutesOf = (b: PlanBlock) => Math.round((Date.parse(b.end) - Date.parse(b.start)) / 60_000);
const KIND: Record<PlanBlock['kind'], { label: string; Icon: typeof Play }> = {
  mission: { label: 'Mission', Icon: Play },
  buffer: { label: 'Buffer', Icon: ShieldCheck },
  break: { label: 'Break', Icon: Coffee },
};

/** Re-renders every 30 seconds so the now marker and the running block move. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** The whole day at a glance: blocks to scale across the window, with a now marker. */
function DayRibbon({ blocks, now, status }: { blocks: PlanBlock[]; now: number; status: string }) {
  const sum = summarise(blocks, now);
  const running = sum.current >= 0 ? blocks[sum.current] : null;
  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  return (
    <section className={`${s.card} ${s.cmd} ${s.tlDeck} ${s.rise}`} aria-label="The day at a glance">
      <div className={s.tlStats}>
        <span>
          <b>{pad(sum.missions)}</b> missions
        </span>
        <span>
          <b className={s.tlGold}>{formatMinutes(sum.focusMinutes)}</b> focus
        </span>
        <span>
          <b>{formatMinutes(sum.spanMinutes)}</b> span
        </span>
        <span className={s.tlStatus}>{status}</span>
      </div>
      <p className={s.tlNowLine}>
        {running ? (
          <>
            Now · <b>{running.title}</b> until {clockOf(running.end)}
          </>
        ) : now < Date.parse(first.start) ? (
          <>First block at {clockOf(first.start)}</>
        ) : (
          <>Outside the planned hours</>
        )}
      </p>
      <div className={s.ribbon} role="img" aria-label={`${sum.missions} missions from ${clockOf(first.start)} to ${clockOf(last.end)}`}>
        {ribbonOf(blocks).map((seg, i) => (
          <span
            key={`${seg.block.start}-${i}`}
            className={s.ribbonSeg}
            data-kind={seg.block.kind}
            data-past={Date.parse(seg.block.end) <= now || undefined}
            style={{ left: `${seg.left}%`, width: `${seg.width}%`, animationDelay: `${0.25 + i * 0.04}s` }}
            title={`${clockOf(seg.block.start)}–${clockOf(seg.block.end)} · ${seg.block.title}`}
          />
        ))}
        {sum.nowAt !== null && <span className={s.ribbonNow} style={{ left: `${sum.nowAt}%` }} aria-hidden />}
      </div>
      <div className={s.ribbonScale} aria-hidden>
        <span>{clockOf(first.start)}</span>
        <span>{clockOf(last.end)}</span>
      </div>
    </section>
  );
}

function BlockRow({ block, index, now, onDrop }: { block: PlanBlock; index: number; now: number; onDrop?: () => void }) {
  const start = Date.parse(block.start);
  const end = Date.parse(block.end);
  const current = start <= now && now < end;
  const past = end <= now;
  const { label, Icon } = KIND[block.kind];
  return (
    <li
      className={`${s.tlRow} ${s.rise}`}
      data-kind={block.kind}
      data-current={current || undefined}
      data-past={past || undefined}
      aria-current={current ? 'time' : undefined}
      style={{ animationDelay: `${0.1 + index * 0.035}s` }}
    >
      <span className={s.tlTime}>
        <b>{clockOf(block.start)}</b>
        {clockOf(block.end)}
      </span>
      <span className={s.tlRail} aria-hidden>
        <span className={s.tlDot} />
      </span>
      <div className={s.tlBlock}>
        {current && <span className={s.tlProg} style={{ width: `${((now - start) / (end - start)) * 100}%` }} aria-hidden />}
        <span className={s.tlIdx}>{pad(index + 1)}</span>
        <Icon size={15} className={s.tlIcon} aria-hidden />
        <span className={s.tlTitle}>{block.title}</span>
        <span className={s.tlKind}>{current ? 'Now' : label}</span>
        <span className={s.tlMins}>{formatMinutes(minutesOf(block))}</span>
        {block.kind === 'mission' && block.missionId && !onDrop && (
          <a href={`/focus?mission=${block.missionId}`} className={s.tlGo} data-snd="high" aria-label={`Focus on ${block.title}`}>
            <Crosshair size={13} aria-hidden /> <span className={s.tlGoText}>Focus</span>
          </a>
        )}
        {onDrop && (
          <button type="button" aria-label={`Leave out ${block.title}`} onClick={onDrop} className={s.tlDrop} data-snd="low">
            <X size={15} aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

function PlanList({ blocks, label, now, onDrop }: { blocks: PlanBlock[]; label: string; now: number; onDrop?: (i: number) => void }) {
  return (
    <ol aria-label={label} className={s.tl}>
      {blocks.map((b, i) => (
        <BlockRow key={`${b.start}-${i}`} block={b} index={i} now={now} onDrop={onDrop && b.kind === 'mission' ? () => onDrop(i) : undefined} />
      ))}
    </ol>
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
  const now = useNow();

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

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const status = saved === undefined ? 'loading…' : proposal ? 'proposal, not saved yet' : saved ? (saved.approvedAt ? 'plan locked in' : 'plan saved') : 'no plan yet';
  const headline = proposal ? 'Shape it.' : saved?.blocks.length ? 'Own the day.' : 'Plan the day.';

  return (
    <DaylightFrame>
      <section className={s.hero} aria-label="Timeline">
        <span className={s.floor} aria-hidden />
        <p className={s.meta}>
          <span className={s.liveDot} aria-hidden />
          {dateLabel} · {status}
        </p>
        <h1 className={s.h1}>
          <Words text="Timeline" delay={0.05} />
          <span className={s.h1em}>
            <Words key={headline} text={headline} delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>Your open missions laid out across the day, with buffers sized from how you actually work.</p>
      </section>

      <div className={s.page}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad} ${s.rise}`}>
            {error}
          </p>
        )}

        {saved === undefined && <p className={s.nothing}>Opening today&apos;s plan…</p>}

        {/* ── Saved plan ── */}
        {saved && !proposal && saved.blocks.length > 0 && (
          <>
            <DayRibbon blocks={saved.blocks} now={now} status={saved.approvedAt ? 'Locked in' : 'Saved'} />
            <div className={s.sec}>
              <span className={s.lab}>Today&apos;s plan</span>
              <span className={s.meta}>{saved.blocks.length} blocks</span>
            </div>
            <PlanList blocks={saved.blocks} label="Today's plan" now={now} />
          </>
        )}

        {/* ── Planner ── */}
        {saved !== undefined && !proposal && (
          <form onSubmit={propose} className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.rise}`} style={{ animationDelay: '0.3s' }} {...tiltHandlers}>
            <div className={s.sec} style={{ marginTop: 0 }}>
              <span className={s.lab}>{saved ? 'Re-plan' : 'Your work window'}</span>
              {saved && <span className={s.meta}>A new plan replaces today&apos;s once you commit it</span>}
            </div>
            <div className={s.form}>
              <label className={s.tlField}>
                <span className={s.meta}>From</span>
                <input type="time" value={from} onChange={(e) => setFrom(e.target.value)} required className={s.field} />
              </label>
              <span className={s.tlArrow} aria-hidden>
                →
              </span>
              <label className={s.tlField}>
                <span className={s.meta}>To</span>
                <input type="time" value={to} onChange={(e) => setTo(e.target.value)} required className={s.field} />
              </label>
              <button type="submit" className={`${s.btn} ${s.btnOx} ${s.tlSubmit}`} disabled={busy !== null} data-snd="drum">
                <CalendarClock size={15} aria-hidden /> {busy === 'propose' ? 'Planning…' : saved ? 'New plan' : 'Plan my day'}
              </button>
            </div>
          </form>
        )}

        {/* ── Proposal ── */}
        {proposal && (
          <>
            <p className={`${s.notice} ${s.rise}`} role="status">
              <span>
                <b>Why this shape: </b>
                {proposal.reason}
                {proposal.bufferScale !== 1 && <> · buffers ×{proposal.bufferScale.toFixed(2)}</>}
              </span>
            </p>
            {proposal.blocks.length > 0 && <DayRibbon blocks={proposal.blocks} now={now} status="Proposal" />}
            <div className={s.sec}>
              <span className={s.lab}>Proposed plan</span>
              <div className={s.btnRow}>
                <button type="button" className={s.btn} onClick={() => setProposal(null)} disabled={busy !== null} data-snd="low">
                  <ArrowLeft size={15} aria-hidden /> Back
                </button>
                <button type="button" className={`${s.btn} ${s.btnOx}`} onClick={save} disabled={!proposal.blocks.length || busy !== null} data-snd="high">
                  <Save size={15} aria-hidden /> {busy === 'save' ? 'Saving…' : 'Commit plan'}
                </button>
              </div>
            </div>
            {proposal.blocks.length > 0 ? (
              <PlanList blocks={proposal.blocks} label="Proposed plan" now={now} onDrop={(i) => setProposal({ ...proposal, blocks: dropBlock(proposal.blocks, i) })} />
            ) : (
              <p className={s.nothing}>Nothing left in the plan. Go back and pick a longer window.</p>
            )}

            {proposal.unscheduled.length > 0 && (
              <section className={`${s.card} ${s.panel} ${s.rise}`} aria-label="Did not fit">
                <div className={s.sec} style={{ marginTop: 0 }}>
                  <span className={s.lab}>Did not fit</span>
                  <span className={s.meta}>{proposal.unscheduled.length} missions</span>
                </div>
                <ul className={s.tlLeft}>
                  {proposal.unscheduled.map((m) => (
                    <li key={m.missionId}>
                      <span>{m.title}</span>
                      <span className={s.tlMins}>{formatMinutes(m.minutes)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </DaylightFrame>
  );
}
