'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Zap, Target, CheckCircle2, FolderKanban } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { NewProjectForm } from '../../../components/dashboard/forms';
import { ProjectSection, type ProjectActions } from '../../../components/dashboard/project-section';
import { apiFetch } from '../../../lib/api/client';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function StatCard({ value, label, icon: Icon, accent }: { value: number; label: string; icon: React.ElementType; accent?: string }) {
  return (
    <div className="relative flex flex-col gap-1 px-4 py-3 sm:px-5 sm:py-4 bg-[#12131a] border border-[#1e2030] rounded-xl overflow-hidden group">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 100%, ${accent ?? '#c9a84c'}10, transparent 70%)` }} />
      <div className="flex items-center gap-2 relative">
        <Icon size={14} className="text-[#4a4d5a]" />
        <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#4a4d5a]" style={{ fontFamily: "'Outfit', sans-serif" }}>{label}</span>
      </div>
      <span className="text-2xl sm:text-3xl font-bold tabular-nums relative" style={{ fontFamily: "'Cormorant Garamond', serif", color: accent ?? '#c9a84c' }}>{value}</span>
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#1e2030" strokeWidth="3" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a8872e" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-[#c9a84c] tabular-nums" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [addingProject, setAddingProject] = useState(false);
  const [confirming, setConfirming] = useState<PendingDelete | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const refresh = useCallback(async () => {
    const res = await apiFetch<WorkspaceOverview>('/api/workspace');
    if (res.success && res.data) setOverview(res.data);
    else setError(res.error?.message ?? 'Could not load your workspace');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        title: `Delete "${project.name}"?`,
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
        title: `Delete "${mission.name}"?`,
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
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#4a4d5a] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>// operations center</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Dashboard</h1>
        </div>
        {error ? <p className="text-sm text-red-400">{error}</p> : <Spinner />}
      </div>
    );
  }

  const { workspace, projects, totals } = overview;
  const completedMissions = totals.missions - totals.activeMissions;

  const filteredProjects = projects.map((p) => {
    if (filter === 'all') return p;
    const keep = filter === 'active'
      ? (s: string) => ['Staged', 'Approved', 'Running'].includes(s)
      : (s: string) => ['Completed', 'Skipped', 'Failed'].includes(s);
    return { ...p, missions: p.missions.filter((m) => keep(m.status)) };
  }).filter((p) => filter === 'all' || p.missions.length > 0);

  const FILTERS = [
    { key: 'all' as const, label: 'ALL' },
    { key: 'active' as const, label: 'ACTIVE' },
    { key: 'completed' as const, label: 'DONE' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#4a4d5a] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>// operations center</span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {workspace?.name ?? 'Dashboard'}
          </h1>
        </div>
        {workspace && !addingProject && (
          <Button className="inline-flex items-center gap-1.5" onClick={() => setAddingProject(true)}>
            <Plus size={16} /> New project
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Stat Cards + Progress Ring */}
      {workspace && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
            <StatCard value={totals.projects} label="Projects" icon={FolderKanban} accent="#c9a84c" />
            <StatCard value={totals.activeMissions} label="Active" icon={Zap} accent="#c9a84c" />
            <StatCard value={completedMissions} label="Done" icon={CheckCircle2} accent="#34d399" />
            <StatCard value={totals.steps} label="Total Steps" icon={Target} accent="#6b6e7a" />
          </div>
          <div className="hidden sm:flex flex-col items-center justify-center gap-1.5 px-5 py-3 bg-[#12131a] border border-[#1e2030] rounded-xl min-w-[120px]">
            <ProgressRing done={totals.stepsDone} total={totals.steps} />
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#4a4d5a] font-medium">Completion</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {workspace && projects.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-[#0e0f16] border border-[#1e2030] rounded-xl w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.12em] font-semibold transition-all min-h-[36px] ${
                filter === f.key
                  ? 'bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30'
                  : 'text-[#4a4d5a] hover:text-[#b8b4ac] border border-transparent'
              }`}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* No workspace */}
      {!workspace && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-[#12131a] border border-[#1e2030] rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center">
            <FolderKanban size={24} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-[#b8b4ac]">No workspace configured</span>
            <a href="/onboarding" className="text-sm text-[#c9a84c] hover:underline font-medium">Set one up</a>
          </div>
        </div>
      )}

      {/* New project form */}
      {addingProject && (
        <NewProjectForm
          onCreate={(name, priority) => send('POST', '/api/projects', { name, priority })}
          onCancel={() => setAddingProject(false)}
        />
      )}

      {/* Empty state */}
      {workspace && projects.length === 0 && !addingProject && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 bg-[#12131a] border border-dashed border-[#1e2030] rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center">
            <Plus size={24} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-[#4a4d5a]">No projects yet</span>
            <button type="button" onClick={() => setAddingProject(true)} className="text-sm text-[#c9a84c] hover:underline font-medium">
              Create your first project
            </button>
          </div>
        </div>
      )}

      {/* Filtered empty */}
      {workspace && projects.length > 0 && filteredProjects.length === 0 && (
        <div className="flex items-center justify-center py-12 text-sm text-[#4a4d5a]">
          No {filter === 'active' ? 'active' : 'completed'} missions right now.
        </div>
      )}

      {/* Project Sections */}
      {filteredProjects.map((project) => (
        <ProjectSection key={project.id} project={project} pendingSteps={pending} actions={actions} />
      ))}

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
