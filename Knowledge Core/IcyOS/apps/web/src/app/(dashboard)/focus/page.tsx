'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, Square } from 'lucide-react';
import { Words } from '../../../components/daylight/command-hero';
import { tiltHandlers } from '../../../components/daylight/daylight-fx';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { formatMinutes } from '../../../lib/inbox/review';
import { apiFetch } from '../../../lib/api/client';
import { formatTimer, localDate } from '../../../lib/day/local';
import { elapsedSeconds, type FocusSession } from '../../../lib/day/types';
import type { SetStepResult, StepView, WorkspaceOverview } from '../../../lib/workspace/overview';

const pad = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const PRESETS = [15, 25, 45, 60, 90];

interface FocusMission {
  id: string;
  name: string;
  projectName: string;
  estimatedMinutes: number | null;
}

interface FocusState {
  active: FocusSession | null;
  missions: FocusMission[];
  nextPlannedMissionId: string | null;
}

type Mood = 'live' | 'paused' | 'over';

/** The focus ring: 60 ticks and an arc that closes at the planned time; with no plan, a comet laps once a minute. */
function FocusRing({ elapsed, planned, mood }: { elapsed: number; planned: number | null; mood: Mood }) {
  const pct = planned ? Math.min(1, elapsed / (planned * 60)) : 0;
  const sweep = planned ? pct : (elapsed % 60) / 60;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const lit = Math.floor(sweep * 60);
  return (
    <div className={s.ring} data-mood={mood}>
      <svg viewBox="0 0 120 120" aria-hidden>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b3122b" />
            <stop offset="55%" stopColor="#d6402f" />
            <stop offset="100%" stopColor="#f1d77a" />
          </linearGradient>
        </defs>
        <g transform="rotate(-90 60 60)">
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2;
            const major = i % 5 === 0;
            const r2 = major ? 61 : 59.2;
            return (
              <line
                key={i}
                x1={60 + 57 * Math.cos(a)}
                y1={60 + 57 * Math.sin(a)}
                x2={60 + r2 * Math.cos(a)}
                y2={60 + r2 * Math.sin(a)}
                className={i < lit ? s.tickOn : major ? s.tickMajor : s.tick}
                strokeWidth={major ? 1.2 : 0.7}
              />
            );
          })}
          <circle cx="60" cy="60" r={r} fill="none" className={s.ringTrack} strokeWidth="3.5" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            className={s.ringArc}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={planned ? circ : `${circ * 0.08} ${circ * 0.92}`}
            strokeDashoffset={planned ? circ * (1 - pct) : -circ * sweep}
          />
        </g>
      </svg>
      <div className={s.ringFace}>
        <span role="timer" aria-label="Focus time" className={s.ringTime}>
          {formatTimer(elapsed)}
        </span>
        <span className={s.ringNote}>{mood === 'paused' ? 'Paused' : mood === 'over' ? 'Running over' : planned ? `of ${formatMinutes(planned)}` : 'Open session'}</span>
      </div>
    </div>
  );
}

export default function FocusPage() {
  const [state, setState] = useState<FocusState | null>(null);
  const [steps, setSteps] = useState<Record<string, StepView[]>>({});
  const [names, setNames] = useState<Record<string, { name: string; projectName: string }>>({});
  const [missionId, setMissionId] = useState('');
  const [planned, setPlanned] = useState('25');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState<FocusSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [focus, overview] = await Promise.all([apiFetch<FocusState>(`/api/focus?date=${localDate()}`), apiFetch<WorkspaceOverview>('/api/workspace')]);
    if (!focus.success || !focus.data) {
      setError(focus.error?.message ?? 'Could not load your focus session');
      return;
    }
    if (overview.success && overview.data) {
      const all = overview.data.projects.flatMap((p) => p.missions.map((m) => ({ ...m, projectName: p.name })));
      setSteps(Object.fromEntries(all.map((m) => [m.id, m.steps])));
      setNames(Object.fromEntries(all.map((m) => [m.id, { name: m.name, projectName: m.projectName }])));
    }
    const data = focus.data;
    setState(data);
    // ?mission= from the Timeline, then the next planned mission, then the first open one.
    const asked = new URLSearchParams(window.location.search).get('mission');
    const pick = [asked, data.nextPlannedMissionId, data.missions[0]?.id].find((id) => id && data.missions.some((m) => m.id === id)) ?? '';
    setMissionId(pick);
    const estimate = data.missions.find((m) => m.id === pick)?.estimatedMinutes;
    setPlanned(String(Math.min(estimate ?? 25, 600)));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = state?.active ?? null;
  const running = Boolean(active && !active.pausedAt);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  function chooseMission(id: string) {
    setMissionId(id);
    const estimate = state?.missions.find((m) => m.id === id)?.estimatedMinutes;
    if (estimate) setPlanned(String(Math.min(estimate, 600)));
  }

  const plannedMinutes = planned.trim() ? Number(planned) : null;
  const plannedOk = plannedMinutes === null || (Number.isInteger(plannedMinutes) && plannedMinutes >= 1 && plannedMinutes <= 600);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!missionId || !plannedOk || busy) return;
    setBusy(true);
    setError(null);
    setFinished(null);
    const res = await apiFetch<FocusSession>('/api/focus/start', { method: 'POST', body: JSON.stringify({ missionId, plannedMinutes }) });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not start focusing');
      return;
    }
    setNow(Date.now());
    setState((st) => (st ? { ...st, active: res.data! } : st));
  }

  async function act(body: { action: 'pause' } | { action: 'resume' } | { action: 'finish'; outcome: 'done' | 'stopped' }) {
    if (!active || busy) return;
    setBusy(true);
    setError(null);
    const res = await apiFetch<FocusSession>(`/api/focus/${active.id}`, { method: 'POST', body: JSON.stringify(body) });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not update the session');
      return;
    }
    setNow(Date.now());
    if (res.data.endedAt) {
      setFinished(res.data);
      await load();
    } else setState((st) => (st ? { ...st, active: res.data! } : st));
  }

  async function toggleStep(step: StepView) {
    if (!active?.missionId) return;
    const mid = active.missionId;
    const completed = !step.completedAt;
    const set = (completedAt: string | null) => setSteps((all) => ({ ...all, [mid]: (all[mid] ?? []).map((x) => (x.id === step.id ? { ...x, completedAt } : x)) }));
    set(completed ? new Date().toISOString() : null);
    const res = await apiFetch<SetStepResult>('/api/actions/complete', { method: 'POST', body: JSON.stringify({ actionId: step.id, completed }) });
    if (res.success && res.data) set(res.data.completed_at);
    else {
      set(step.completedAt);
      setError(res.error?.message ?? 'Could not update the step');
    }
  }

  // From the dashboard data, so the name stays even once ticking every step completes the mission.
  const activeMission = active?.missionId ? names[active.missionId] : undefined;
  const activeSteps = active?.missionId ? (steps[active.missionId] ?? []) : [];
  const elapsed = active ? elapsedSeconds(active, now) : 0;
  const over = Boolean(active?.plannedMinutes && elapsed > active.plannedMinutes * 60);
  const paused = Boolean(active?.pausedAt);
  const mood: Mood = paused ? 'paused' : over ? 'over' : 'live';
  const doneSteps = activeSteps.filter((x) => x.completedAt).length;

  // The tab shows the timer while a session runs, so it can be watched from another tab.
  useEffect(() => {
    if (!active) return;
    const before = document.title;
    document.title = `${paused ? '⏸' : '●'} ${formatTimer(elapsed)} · ${activeMission?.name ?? 'Focus'}`;
    return () => {
      document.title = before;
    };
  }, [active, paused, elapsed, activeMission?.name]);

  const headline = active ? (paused ? 'Catch your breath.' : over ? 'Land it.' : 'Locked in.') : 'One thing.';
  const status = !state ? 'loading…' : active ? (paused ? 'session paused' : over ? 'running over' : 'session live') : plural(state.missions.length, 'open mission');

  return (
    <DaylightFrame>
      <section className={s.hero} aria-label="Focus">
        <span className={s.floor} aria-hidden />
        <p className={s.meta}>
          <span className={s.liveDot} aria-hidden />
          Focus · {status}
        </p>
        <h1 className={s.h1}>
          <Words text="Focus" delay={0.05} />
          <span className={s.h1em}>
            <Words key={headline} text={headline} delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>One mission, one timer. Finished sessions teach the Timeline how long things really take.</p>
      </section>

      <div className={s.page}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad} ${s.rise}`}>
            {error}
          </p>
        )}

        {finished && (
          <div className={`${s.notice} ${finished.outcome === 'done' ? s.noticeGood : ''} ${s.rise}`} role="status">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {finished.outcome === 'done' ? <CheckCircle2 size={16} aria-hidden /> : <Square size={14} aria-hidden />}
              Session {finished.outcome === 'done' ? 'complete' : 'stopped'} ·{' '}
              {(finished.focusSeconds ?? 0) < 60 ? 'under a minute' : formatMinutes(Math.round((finished.focusSeconds ?? 0) / 60))} focused
            </span>
            <a href="/review" style={{ textDecoration: 'underline' }}>
              Review the day →
            </a>
          </div>
        )}

        {!state && !error && <p className={s.nothing}>Opening your focus chamber…</p>}

        {/* ── Active session ── */}
        {active && (
          <>
            <section className={`${s.card} ${s.cmd} ${s.chamber} ${s.rise}`} data-mood={mood} aria-label="Focus session">
              <span className={s.chamberTag}>
                <span className={s.chamberDot} aria-hidden />
                {activeMission?.projectName ?? 'Mission'}
              </span>
              <h2 className={s.chamberTitle}>{activeMission?.name ?? 'Your mission'}</h2>
              <FocusRing elapsed={elapsed} planned={active.plannedMinutes} mood={mood} />
              <div className={s.chamberActs}>
                {paused ? (
                  <button type="button" className={`${s.btn} ${s.chamberGhost}`} onClick={() => act({ action: 'resume' })} disabled={busy} data-snd="high">
                    <Play size={15} aria-hidden /> Resume
                  </button>
                ) : (
                  <button type="button" className={`${s.btn} ${s.chamberGhost}`} onClick={() => act({ action: 'pause' })} disabled={busy} data-snd="low">
                    <Pause size={15} aria-hidden /> Pause
                  </button>
                )}
                <button type="button" className={`${s.btn} ${s.chamberGold}`} onClick={() => act({ action: 'finish', outcome: 'done' })} disabled={busy} data-snd="drum">
                  <CheckCircle2 size={15} aria-hidden /> Done
                </button>
                <button type="button" className={`${s.btn} ${s.chamberStop}`} onClick={() => act({ action: 'finish', outcome: 'stopped' })} disabled={busy} data-snd="low">
                  <Square size={13} aria-hidden /> Stop
                </button>
              </div>
            </section>

            {activeSteps.length > 0 && (
              <section className={`${s.card} ${s.panel} ${s.rise}`} style={{ animationDelay: '0.15s' }} aria-label="Steps">
                <div className={s.sec} style={{ marginTop: 0 }}>
                  <span className={s.lab}>Steps</span>
                  <span className={s.meta}>
                    {doneSteps} of {activeSteps.length} done
                  </span>
                </div>
                <span className={s.g} style={{ display: 'block', flex: 'none' }} aria-hidden>
                  <span className={`${s.fill} ${doneSteps >= activeSteps.length ? s.fillDone : ''}`} style={{ width: `${(doneSteps / activeSteps.length) * 100}%` }} />
                </span>
                <ul className={s.steps} aria-label="Steps">
                  {activeSteps.map((x, i) => (
                    <li key={x.id} className={`${s.step} ${x.completedAt ? s.stepDone : ''}`}>
                      <input type="checkbox" className={s.box} aria-label={x.command} checked={Boolean(x.completedAt)} onChange={() => void toggleStep(x)} data-snd="high" />
                      <span className={s.stepText}>{x.command}</span>
                      <span className={s.idx} aria-hidden>
                        {pad(i + 1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {/* ── Setup ── */}
        {state &&
          !active &&
          (state.missions.length ? (
            <form onSubmit={start} className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.rise}`} style={{ animationDelay: '0.3s' }} {...tiltHandlers}>
              <div className={s.sec} style={{ marginTop: 0 }}>
                <span className={s.lab}>Pick the mission</span>
                <span className={s.meta}>{plural(state.missions.length, 'open mission')}</span>
              </div>
              <div role="radiogroup" aria-label="Mission" className={s.picks}>
                {state.missions.map((m) => {
                  const on = m.id === missionId;
                  const next = m.id === state.nextPlannedMissionId;
                  return (
                    <button key={m.id} type="button" role="radio" aria-checked={on} className={s.pick} data-on={on || undefined} onClick={() => chooseMission(m.id)} data-snd="high">
                      <span className={s.pickName}>{m.name}</span>
                      <span className={s.pickMeta}>
                        {m.projectName}
                        {m.estimatedMinutes != null && <> · {formatMinutes(m.estimatedMinutes)}</>}
                      </span>
                      {next && <span className={s.pickNext}>Next in plan</span>}
                    </button>
                  );
                })}
              </div>

              <div className={s.sec}>
                <span className={s.lab}>How long</span>
                <span className={s.meta}>{plannedMinutes && plannedOk ? `The ring closes at ${formatMinutes(plannedMinutes)}` : 'Blank for an open session'}</span>
              </div>
              <div className={s.form}>
                <div className={s.filters} style={{ flexWrap: 'wrap', gap: 6 }}>
                  {PRESETS.map((p) => (
                    <button key={p} type="button" className={`${s.filter} ${s.preset} ${planned === String(p) ? s.filterOn : ''}`} aria-pressed={planned === String(p)} onClick={() => setPlanned(String(p))}>
                      {formatMinutes(p)}
                    </button>
                  ))}
                </div>
                <label className={s.presetOwn}>
                  <input
                    aria-label="Planned minutes"
                    inputMode="numeric"
                    value={planned}
                    onChange={(e) => setPlanned(e.target.value)}
                    aria-invalid={!plannedOk}
                    placeholder="—"
                    className={s.field}
                  />
                  <span className={s.meta}>min</span>
                </label>
                <button type="submit" className={`${s.btn} ${s.btnOx} ${s.tlSubmit}`} disabled={!missionId || !plannedOk || busy} data-snd="drum">
                  <Play size={15} aria-hidden /> {busy ? 'Starting…' : 'Start focusing'}
                </button>
              </div>
              {!plannedOk && (
                <p className={s.formError} role="alert">
                  Whole minutes from 1 to 600, or leave it blank for an open session.
                </p>
              )}
            </form>
          ) : (
            <section className={`${s.card} ${s.panel} ${s.empty} ${s.rise}`}>
              <h2 className={s.h3}>No open missions</h2>
              <p>Empty your head in the Inbox and IcyOS turns it into missions to focus on.</p>
              <a href="/inbox" className={`${s.btn} ${s.btnOx}`}>
                Go to the Inbox
              </a>
            </section>
          ))}
      </div>
    </DaylightFrame>
  );
}
