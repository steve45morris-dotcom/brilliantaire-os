'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { NewProjectForm } from '../../../components/dashboard/forms';
import { ProjectSection, type ProjectActions } from '../../../components/dashboard/project-section';
import { apiFetch } from '../../../lib/api/client';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function DashboardPage() {
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [addingProject, setAddingProject] = useState(false);
  const [confirming, setConfirming] = useState<PendingDelete | null>(null);

  const refresh = useCallback(async () => {
    const res = await apiFetch<WorkspaceOverview>('/api/workspace');
    if (res.success && res.data) setOverview(res.data);
    else setError(res.error?.message ?? 'Could not load your workspace');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Sends one change, then reloads the workspace. Returns whether it worked. */
  async function send(method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: object): Promise<boolean> {
    setError(null);
    const res = await apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
    if (!res.success) {
      setError(res.error?.message ?? 'Could not save your change');
      return false;
    }
    await refresh();
    return true;
  }

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

  function setStep(missionId: string, stepId: string, completedAt: string | null) {
    updateMission(missionId, (m) => {
      const steps = m.steps.map((s) => (s.id === stepId ? { ...s, completedAt } : s));
      return { ...m, steps, stepsDone: steps.filter((s) => s.completedAt).length };
    });
  }

  // Ticks update the screen at once and roll back if saving fails.
  async function toggleStep(mission: MissionView, stepId: string, completed: boolean) {
    const before = mission.steps.find((s) => s.id === stepId)?.completedAt ?? null;
    setError(null);
    setPending((p) => new Set(p).add(stepId));
    setStep(mission.id, stepId, completed ? new Date().toISOString() : null);

    const res = await apiFetch<SetStepResult>('/api/actions/complete', {
      method: 'POST',
      body: JSON.stringify({ actionId: stepId, completed }),
    });
    if (res.success && res.data) {
      const result = res.data;
      setStep(mission.id, stepId, result.completed_at);
      updateMission(mission.id, (m) => ({ ...m, status: result.mission_status }));
    } else {
      setStep(mission.id, stepId, before);
      setError(res.error?.message ?? 'Could not update the step');
    }
    setPending((p) => {
      const next = new Set(p);
      next.delete(stepId);
      return next;
    });
  }

  const actions: ProjectActions = {
    toggleStep: (mission, stepId, completed) => void toggleStep(mission, stepId, completed),
    renameProject: (id, name) => send('PATCH', `/api/projects/${id}`, { name }),
    setPriority: (id, priority) => send('PATCH', `/api/projects/${id}`, { priority }),
    deleteProject: (project) =>
      setConfirming({
        title: `Delete “${project.name}”?`,
        message:
          project.missions.length > 0
            ? `This also deletes its ${plural(project.missions.length, 'mission')} and their steps. It can't be undone.`
            : "It can't be undone.",
        run: () => send('DELETE', `/api/projects/${project.id}`),
      }),
    createMission: (projectId, name, steps) => send('POST', `/api/projects/${projectId}/missions`, { name, steps }),
    renameMission: (id, name) => send('PATCH', `/api/missions/${id}`, { name }),
    deleteMission: (mission) =>
      setConfirming({
        title: `Delete “${mission.name}”?`,
        message:
          mission.steps.length > 0
            ? `This also deletes its ${plural(mission.steps.length, 'step')}. It can't be undone.`
            : "It can't be undone.",
        run: () => send('DELETE', `/api/missions/${mission.id}`),
      }),
    addStep: (missionId, text) => send('POST', `/api/missions/${missionId}/steps`, { text }),
    renameStep: (stepId, text) => send('PATCH', `/api/actions/${stepId}`, { text }),
    deleteStep: (step) => send('DELETE', `/api/actions/${step.id}`),
  };

  if (!overview) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Dashboard</h1>
        {error ? <p className="text-sm text-red-400">{error}</p> : <Spinner />}
      </div>
    );
  }

  const { workspace, projects, totals } = overview;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{workspace?.name ?? 'Dashboard'}</h1>
          <p className="text-[#4a4d5a] text-sm">
            {plural(totals.projects, 'project')} · {plural(totals.activeMissions, 'active mission')} · {totals.stepsDone} of{' '}
            {totals.steps} steps done
          </p>
        </div>
        {workspace && !addingProject && (
          <Button className="inline-flex items-center gap-1.5" onClick={() => setAddingProject(true)}>
            <Plus size={16} /> New project
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {!workspace && (
        <Card className="flex flex-col items-start gap-3">
          <span className="text-sm text-[#b8b4ac]">You don’t have a workspace yet.</span>
          <a href="/onboarding" className="text-sm text-[#c9a84c] hover:underline">Set one up</a>
        </Card>
      )}

      {addingProject && (
        <NewProjectForm
          onCreate={(name, priority) => send('POST', '/api/projects', { name, priority })}
          onCancel={() => setAddingProject(false)}
        />
      )}

      {workspace && projects.length === 0 && !addingProject && (
        <Card className="border-dashed text-sm text-[#4a4d5a]">
          No projects yet.{' '}
          <button type="button" onClick={() => setAddingProject(true)} className="text-[#c9a84c] hover:underline">
            Add your first
          </button>
        </Card>
      )}

      {projects.map((project) => (
        <ProjectSection key={project.id} project={project} pendingSteps={pending} actions={actions} />
      ))}

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
