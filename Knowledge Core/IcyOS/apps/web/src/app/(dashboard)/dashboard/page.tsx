'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';
import { apiFetch } from '../../../lib/api/client';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const STATUS_STYLE: Record<string, string> = {
  Staged: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  Approved: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  Running: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  Completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Skipped: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  Failed: 'bg-red-500/10 text-red-300 border-red-500/30',
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch<WorkspaceOverview>('/api/workspace').then((res) => {
      if (res.success && res.data) setOverview(res.data);
      else setError(res.error?.message ?? 'Could not load your workspace');
    });
  }, []);

  function updateMission(missionId: string, change: (m: MissionView) => MissionView) {
    setOverview((prev) => {
      if (!prev) return prev;
      const projects = prev.projects.map((p) => ({
        ...p,
        missions: p.missions.map((m) => (m.id === missionId ? change(m) : m)),
      }));
      const missions = projects.flatMap((p) => p.missions);
      return {
        ...prev,
        projects,
        totals: {
          ...prev.totals,
          activeMissions: missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status)).length,
          stepsDone: missions.reduce((n, m) => n + m.stepsDone, 0),
        },
      };
    });
  }

  function setStep(mission: MissionView, stepId: string, completedAt: string | null) {
    updateMission(mission.id, (m) => {
      const steps = m.steps.map((s) => (s.id === stepId ? { ...s, completedAt } : s));
      return { ...m, steps, stepsDone: steps.filter((s) => s.completedAt).length };
    });
  }

  async function toggleStep(mission: MissionView, stepId: string, completed: boolean) {
    const before = mission.steps.find((s) => s.id === stepId)?.completedAt ?? null;
    setError(null);
    setPending((p) => new Set(p).add(stepId));
    setStep(mission, stepId, completed ? new Date().toISOString() : null);

    const res = await apiFetch<SetStepResult>('/api/actions/complete', {
      method: 'POST',
      body: JSON.stringify({ actionId: stepId, completed }),
    });
    if (res.success && res.data) {
      const result = res.data;
      setStep(mission, stepId, result.completed_at);
      updateMission(mission.id, (m) => ({ ...m, status: result.mission_status }));
    } else {
      setStep(mission, stepId, before);
      setError(res.error?.message ?? 'Could not update the step');
    }
    setPending((p) => {
      const next = new Set(p);
      next.delete(stepId);
      return next;
    });
  }

  if (!overview) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
        {error ? <p className="text-sm text-red-400">{error}</p> : <Spinner />}
      </div>
    );
  }

  const { workspace, projects, totals } = overview;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{workspace?.name ?? 'Dashboard'}</h1>
        <p className="text-zinc-500 text-sm">
          {totals.projects} project{totals.projects === 1 ? '' : 's'} · {totals.activeMissions} active mission
          {totals.activeMissions === 1 ? '' : 's'} · {totals.stepsDone} of {totals.steps} steps done
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {!workspace && (
        <Card className="flex flex-col items-start gap-3">
          <span className="text-sm text-zinc-300">You don’t have a workspace yet.</span>
          <a href="/onboarding" className="text-sm text-pink-400 hover:underline">Set one up</a>
        </Card>
      )}

      {projects.map((project) => (
        <section key={project.id} className="flex flex-col gap-3" aria-label={project.name}>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">{project.name}</h2>
            <Badge>{project.priority}</Badge>
          </div>

          {project.missions.length === 0 && (
            <Card className="border-dashed text-sm text-zinc-500">No missions in this project yet.</Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {project.missions.map((mission) => (
              <Card key={mission.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-semibold text-zinc-100">{mission.name}</span>
                    <span className="text-xs text-zinc-500">{mission.sprintName}</span>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLE[mission.status] ?? STATUS_STYLE.Staged}`}
                  >
                    {mission.status}
                  </span>
                </div>

                {mission.steps.length > 0 && (
                  <>
                    <div
                      className="h-1.5 rounded bg-zinc-800 overflow-hidden"
                      role="progressbar"
                      aria-label={`${mission.name} progress`}
                      aria-valuemin={0}
                      aria-valuemax={mission.steps.length}
                      aria-valuenow={mission.stepsDone}
                    >
                      <div
                        className="h-full bg-pink-500 transition-all"
                        style={{ width: `${(mission.stepsDone / mission.steps.length) * 100}%` }}
                      />
                    </div>
                    <ul className="flex flex-col gap-2">
                      {mission.steps.map((step) => (
                        <li key={step.id}>
                          <label className="flex items-start gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={Boolean(step.completedAt)}
                              disabled={pending.has(step.id)}
                              onChange={(e) => toggleStep(mission, step.id, e.target.checked)}
                            />
                            <span className={step.completedAt ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                              {step.command}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
