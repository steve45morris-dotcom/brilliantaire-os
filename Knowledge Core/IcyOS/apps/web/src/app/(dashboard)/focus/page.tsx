'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, Square, AlertCircle, Crosshair } from 'lucide-react';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, SegmentBar, TacButton, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import { formatTimer, localDate } from '../../../lib/day/local';
import { elapsedSeconds, type FocusSession } from '../../../lib/day/types';
import type { SetStepResult, StepView, WorkspaceOverview } from '../../../lib/workspace/overview';

const AMBER = '#fbbf24';
const pad = (n: number) => String(n).padStart(2, '0');
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

function FocusRing({ elapsed, planned, paused, over }: { elapsed: number; planned: number | null; paused: boolean; over: boolean }) {
  const pct = planned ? Math.min(1, elapsed / (planned * 60)) : 0;
  const color = paused ? '#4a4d5a' : over ? AMBER : GOLD;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const ticks = 60;
  // Without a plan the ring sweeps once a minute so it still reads as alive.
  const sweep = planned ? pct : (elapsed % 60) / 60;
  const litCount = Math.floor(sweep * ticks);

  return (
    <div className="relative w-[260px] h-[260px] sm:w-[300px] sm:h-[300px] shrink-0">
      <div
        className="absolute inset-0 rounded-full transition-all duration-700"
        style={{ boxShadow: paused ? 'none' : `0 0 60px ${color}22, inset 0 0 40px ${color}0a` }}
      />
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={over ? '#b45309' : '#8c6e23'} />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor={over ? '#fde68a' : '#ebdcaa'} />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks }).map((_, i) => {
          const a = (i / ticks) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = 57;
          const r2 = major ? 61 : 59;
          const lit = i < litCount;
          return (
            <line
              key={i}
              x1={60 + r1 * Math.cos(a)} y1={60 + r1 * Math.sin(a)}
              x2={60 + r2 * Math.cos(a)} y2={60 + r2 * Math.sin(a)}
              stroke={lit ? color : major ? '#2a2d3a' : '#1e2030'}
              strokeWidth={major ? 1.2 : 0.7}
              style={{ transition: 'stroke 0.4s' }}
            />
          );
        })}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#14161e" strokeWidth="3.5" />
        {planned ? (
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="url(#focusGrad)" strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 1s linear', filter: paused ? 'none' : `drop-shadow(0 0 6px ${color}99)` }}
          />
        ) : (
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={color} strokeWidth="3.5" strokeLinecap="round"
            strokeDasharray={`${circ * 0.08} ${circ * 0.92}`}
            strokeDashoffset={-circ * sweep}
            style={{ transition: 'stroke-dashoffset 1s linear', filter: paused ? 'none' : `drop-shadow(0 0 6px ${color}99)` }}
          />
        )}
        <circle cx="60" cy="60" r="44" fill="none" stroke="#14161e" strokeWidth="0.6" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          role="timer"
          aria-label="Focus time"
          className="font-tactical font-bold tabular-nums leading-none text-[44px] sm:text-[52px]"
          style={{
            background: paused ? 'none' : `linear-gradient(180deg, ${over ? '#fde68a' : '#ebdcaa'}, ${color} 60%, ${over ? '#b45309' : '#a8872e'})`,
            WebkitBackgroundClip: paused ? 'unset' : 'text',
            WebkitTextFillColor: paused ? '#6b6e7a' : 'transparent',
            textShadow: paused ? 'none' : `0 0 24px ${color}44`,
          }}
        >
          {formatTimer(elapsed)}
        </span>
        <span className="font-tactical text-[9px] tracking-[0.26em] mt-2" style={{ color: paused ? '#4a4d5a' : over ? AMBER : '#6b6e7a' }}>
          {paused ? 'PAUSED' : over ? 'RUNNING OVER' : planned ? `OF ${formatMinutes(planned).toUpperCase()}` : 'OPEN SESSION'}
        </span>
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
    const [focus, overview] = await Promise.all([
      apiFetch<FocusState>(`/api/focus?date=${localDate()}`),
      apiFetch<WorkspaceOverview>('/api/workspace'),
    ]);
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
    setState((s) => (s ? { ...s, active: res.data! } : s));
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
    } else setState((s) => (s ? { ...s, active: res.data! } : s));
  }

  async function toggleStep(step: StepView) {
    if (!active?.missionId) return;
    const mid = active.missionId;
    const completed = !step.completedAt;
    const set = (completedAt: string | null) =>
      setSteps((all) => ({ ...all, [mid]: (all[mid] ?? []).map((s) => (s.id === step.id ? { ...s, completedAt } : s)) }));
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
  const activeSteps = active?.missionId ? steps[active.missionId] ?? [] : [];
  const elapsed = active ? elapsedSeconds(active, now) : 0;
  const over = Boolean(active?.plannedMinutes && elapsed > active.plannedMinutes * 60);
  const paused = Boolean(active?.pausedAt);
  const doneSteps = activeSteps.filter((s) => s.completedAt).length;
  const selectedMission = state?.missions.find((m) => m.id === missionId);
  const accent = paused ? 'rgba(74,77,90,0.6)' : over ? 'rgba(251,191,36,0.6)' : 'rgba(201,168,76,0.55)';

  return (
    <div className="relative flex flex-col gap-5 max-w-3xl">
      <Backdrop />

      <PageHeader
        eyebrow="FOCUS CHAMBER"
        title="Focus"
        aside={
          state && (
            <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">
              {pad(state.missions.length)} MISSIONS OPEN
            </span>
          )
        }
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">One mission, one timer. Finished sessions teach the Timeline how long things really take.</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {finished && (
        <div
          className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border overflow-hidden"
          style={{
            borderColor: finished.outcome === 'done' ? 'rgba(52,211,153,0.25)' : 'rgba(107,110,122,0.3)',
            background: finished.outcome === 'done' ? 'linear-gradient(160deg, rgba(52,211,153,0.07), transparent)' : 'linear-gradient(160deg, rgba(107,110,122,0.06), transparent)',
          }}
        >
          <CornerBrackets color={finished.outcome === 'done' ? 'rgba(52,211,153,0.5)' : 'rgba(107,110,122,0.5)'} size={12} />
          <span className={`inline-flex items-center gap-2 font-tactical text-[11px] tracking-[0.14em] ${finished.outcome === 'done' ? 'text-emerald-300' : 'text-[#8a8d9a]'}`}>
            {finished.outcome === 'done' ? <CheckCircle2 size={14} /> : <Square size={12} />}
            SESSION {finished.outcome === 'done' ? 'COMPLETE' : 'STOPPED'} ·{' '}
            {(finished.focusSeconds ?? 0) < 60 ? 'UNDER A MINUTE' : formatMinutes(Math.round((finished.focusSeconds ?? 0) / 60)).toUpperCase()} FOCUSED
          </span>
          <a href="/review" className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">REVIEW THE DAY →</a>
        </div>
      )}

      {!state && !error && (
        <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// INITIALIZING</span>
      )}

      {/* ── Active session ── */}
      {active && (
        <>
          <SectionLabel>{paused ? 'SESSION PAUSED' : over ? 'SESSION OVERRUN' : 'SESSION LIVE'}</SectionLabel>
          <Panel accent={accent}>
            {!paused && <span aria-hidden className="hud-scan" />}
            <div className="flex flex-col items-center gap-6 px-6 pt-8 pb-7">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="inline-flex items-center gap-2 font-tactical text-[10px] tracking-[0.2em] text-[#6b6e7a]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${!paused ? (over ? '' : 'hud-pulse-gold') : ''}`}
                    style={{ background: paused ? '#4a4d5a' : over ? AMBER : GOLD, boxShadow: paused ? 'none' : `0 0 6px ${over ? AMBER : GOLD}` }}
                  />
                  {activeMission?.projectName?.toUpperCase() ?? 'TARGET LOCKED'}
                </span>
                <span className="text-xl sm:text-2xl font-semibold text-[#ece8de] leading-tight">{activeMission?.name ?? 'Your mission'}</span>
              </div>

              <FocusRing elapsed={elapsed} planned={active.plannedMinutes} paused={paused} over={over} />

              <div className="flex flex-wrap justify-center gap-2">
                {paused ? (
                  <TacButton variant="ghost" onClick={() => act({ action: 'resume' })} disabled={busy}>
                    <Play size={13} /> RESUME
                  </TacButton>
                ) : (
                  <TacButton variant="ghost" onClick={() => act({ action: 'pause' })} disabled={busy}>
                    <Pause size={13} /> PAUSE
                  </TacButton>
                )}
                <TacButton onClick={() => act({ action: 'finish', outcome: 'done' })} disabled={busy}>
                  <CheckCircle2 size={13} /> DONE
                </TacButton>
                <TacButton variant="danger" onClick={() => act({ action: 'finish', outcome: 'stopped' })} disabled={busy}>
                  <Square size={11} /> STOP
                </TacButton>
              </div>
            </div>

            {activeSteps.length > 0 && (
              <div className="border-t border-[#1e2030] px-6 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">STEPS</span>
                  <div className="flex-1"><SegmentBar done={doneSteps} total={activeSteps.length} height={3} color={doneSteps >= activeSteps.length ? GREEN : GOLD} /></div>
                  <span className="font-tactical text-[10px] tabular-nums text-[#4a4d5a]">
                    <span className="text-[#b8b4ac]">{doneSteps}</span>/{activeSteps.length}
                  </span>
                </div>
                <ul aria-label="Steps" className="flex flex-col">
                  {activeSteps.map((s, i) => (
                    <li key={s.id} className={i > 0 ? 'border-t border-[#1e2030]/40' : ''}>
                      <label className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-sm cursor-pointer hover:bg-[#13141c] transition-colors">
                        <input type="checkbox" className="tac-check" checked={Boolean(s.completedAt)} onChange={() => void toggleStep(s)} />
                        <span className={`text-[13.5px] ${s.completedAt ? 'line-through text-[#4a4d5a] decoration-[#2a2d3a]' : 'text-[#c4c0b8]'}`}>{s.command}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </>
      )}

      {/* ── Setup ── */}
      {state && !active && (
        state.missions.length ? (
          <>
            <SectionLabel>TARGET SELECT</SectionLabel>
            <Panel>
              <form onSubmit={start} className="flex flex-col gap-5 px-6 py-5">
                <div className="flex flex-col gap-1.5">
                  <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">MISSION</span>
                  <div className="relative">
                    <Crosshair size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9a84c] pointer-events-none" />
                    <select
                      aria-label="Mission"
                      value={missionId}
                      onChange={(e) => chooseMission(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-[#08090e] border border-[#1e2030] rounded-md text-[15px] font-semibold text-[#e0dcd2] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors appearance-none"
                    >
                      {state.missions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} · {m.projectName}{m.id === state.nextPlannedMissionId ? '  ◆ NEXT IN PLAN' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedMission && (
                    <div className="flex items-center gap-3 font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a] pt-0.5">
                      <span className="text-[#6b6e7a]">{selectedMission.projectName.toUpperCase()}</span>
                      {selectedMission.estimatedMinutes != null && (
                        <>
                          <span className="text-[#2a2d3a]">·</span>
                          <span>EST <span className="text-[#b8b4ac]">{formatMinutes(selectedMission.estimatedMinutes).toUpperCase()}</span></span>
                        </>
                      )}
                      {selectedMission.id === state.nextPlannedMissionId && (
                        <>
                          <span className="text-[#2a2d3a]">·</span>
                          <span className="text-[#c9a84c]">◆ NEXT IN PLAN</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a]">PLANNED DURATION</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESETS.map((p) => {
                      const on = planned === String(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPlanned(String(p))}
                          className="font-tactical px-3 min-h-[36px] rounded-md text-[11px] tracking-[0.12em] font-semibold transition-all"
                          style={{
                            color: on ? '#c9a84c' : '#6b6e7a',
                            background: on ? 'rgba(201,168,76,0.10)' : 'transparent',
                            boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.4)' : 'inset 0 0 0 1px #1e2030',
                          }}
                        >
                          {formatMinutes(p).toUpperCase()}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-2 ml-1">
                      <input
                        aria-label="Planned minutes"
                        inputMode="numeric"
                        value={planned}
                        onChange={(e) => setPlanned(e.target.value)}
                        aria-invalid={!plannedOk}
                        placeholder="—"
                        className={`w-20 px-3 min-h-[36px] bg-[#08090e] border rounded-md font-tactical text-[13px] tabular-nums text-[#e0dcd2] focus:outline-none transition-colors ${plannedOk ? 'border-[#1e2030] focus:border-[#c9a84c]/50' : 'border-red-500/50'}`}
                      />
                      <span className="font-tactical text-[10px] tracking-[0.12em] text-[#4a4d5a]">MIN</span>
                    </div>
                  </div>
                  {!plannedOk && <span className="font-tactical text-[9px] tracking-[0.12em] text-red-400">WHOLE MINUTES 1–600, OR BLANK FOR OPEN</span>}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-[#1e2030]">
                  <span className="font-tactical text-[9px] tracking-[0.16em] text-[#2f3240] pt-4">
                    {plannedMinutes ? `RING CLOSES AT ${formatMinutes(plannedMinutes).toUpperCase()}` : 'OPEN SESSION · NO LIMIT'}
                  </span>
                  <div className="pt-4">
                    <TacButton type="submit" disabled={!missionId || !plannedOk || busy}>
                      <Play size={13} /> {busy ? 'STARTING…' : 'ENGAGE'}
                    </TacButton>
                  </div>
                </div>
              </form>
            </Panel>
          </>
        ) : (
          <Panel className="px-6 py-8 flex flex-col items-start gap-3">
            <span className="font-tactical text-[11px] tracking-[0.14em] text-[#b8b4ac]">NO OPEN MISSIONS</span>
            <a href="/inbox" className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">ADD SOME IN THE INBOX →</a>
          </Panel>
        )
      )}
    </div>
  );
}
