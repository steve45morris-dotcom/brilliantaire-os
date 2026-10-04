'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, Square } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatMinutes } from '../../../components/dashboard/mission-card';
import { apiFetch } from '../../../lib/api/client';
import { formatTimer, localDate } from '../../../lib/day/local';
import { elapsedSeconds, type FocusSession } from '../../../lib/day/types';
import type { SetStepResult, StepView, WorkspaceOverview } from '../../../lib/workspace/overview';

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

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Focus</h1>
        <p className="text-zinc-500 text-sm">One mission, one timer. Finished sessions teach the Timeline how long things really take.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {finished && (
        <Card className="border-emerald-500/30">
          <span className="text-sm text-emerald-300">
            {finished.outcome === 'done' ? 'Done' : 'Stopped'} after{' '}
            {(finished.focusSeconds ?? 0) < 60 ? 'under a minute' : formatMinutes(Math.round((finished.focusSeconds ?? 0) / 60))} of focus.
          </span>
        </Card>
      )}

      {!state && !error && <p className="text-sm text-zinc-500">Loading…</p>}

      {active && (
        <Card className="flex flex-col items-center gap-5 py-10">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs uppercase tracking-wide text-zinc-500">{activeMission?.projectName ?? 'Focusing on'}</span>
            <span className="text-xl font-semibold text-zinc-100">{activeMission?.name ?? 'Your mission'}</span>
          </div>
          <span
            role="timer"
            aria-label="Focus time"
            className={`font-mono text-6xl tabular-nums ${active.pausedAt ? 'text-zinc-500' : over ? 'text-amber-300' : 'text-pink-300'}`}
          >
            {formatTimer(elapsed)}
          </span>
          <span className="text-xs text-zinc-500">
            {active.pausedAt ? 'Paused' : active.plannedMinutes ? `Planned ${formatMinutes(active.plannedMinutes)}${over ? ' · running over' : ''}` : 'No time limit'}
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {active.pausedAt ? (
              <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => act({ action: 'resume' })} disabled={busy}>
                <Play size={15} /> Resume
              </Button>
            ) : (
              <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => act({ action: 'pause' })} disabled={busy}>
                <Pause size={15} /> Pause
              </Button>
            )}
            <Button className="inline-flex items-center gap-2" onClick={() => act({ action: 'finish', outcome: 'done' })} disabled={busy}>
              <CheckCircle2 size={15} /> Done
            </Button>
            <Button variant="danger" className="inline-flex items-center gap-2" onClick={() => act({ action: 'finish', outcome: 'stopped' })} disabled={busy}>
              <Square size={15} /> Stop
            </Button>
          </div>
          {activeSteps.length > 0 && (
            <ul aria-label="Steps" className="flex flex-col gap-2 w-full max-w-md pt-2">
              {activeSteps.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={Boolean(s.completedAt)} onChange={() => void toggleStep(s)} className="accent-pink-500" />
                    <span className={s.completedAt ? 'line-through text-zinc-500' : 'text-zinc-200'}>{s.command}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {state && !active && (
        state.missions.length ? (
          <Card>
            <form onSubmit={start} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                Mission
                <select
                  value={missionId}
                  onChange={(e) => chooseMission(e.target.value)}
                  className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                >
                  {state.missions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.projectName}
                      {m.id === state.nextPlannedMissionId ? ' (next in your plan)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500 w-40">
                Planned minutes
                <Input inputMode="numeric" value={planned} onChange={(e) => setPlanned(e.target.value)} aria-invalid={!plannedOk} />
              </label>
              {!plannedOk && <span className="text-xs text-red-400">Use a whole number of minutes from 1 to 600, or leave it blank.</span>}
              <Button type="submit" className="self-start inline-flex items-center gap-2" disabled={!missionId || !plannedOk || busy}>
                <Play size={15} /> {busy ? 'Starting…' : 'Start focusing'}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="flex flex-col items-start gap-2">
            <span className="text-sm text-zinc-300">No open missions to focus on.</span>
            <a href="/inbox" className="text-sm text-pink-400 hover:underline">Add some in the Inbox</a>
          </Card>
        )
      )}
    </div>
  );
}
