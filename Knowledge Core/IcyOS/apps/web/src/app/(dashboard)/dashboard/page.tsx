'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Zap, Target, CheckCircle2, FolderKanban, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { NewProjectForm } from '../../../components/dashboard/forms';
import { ProjectSection, type ProjectActions } from '../../../components/dashboard/project-section';
import { apiFetch } from '../../../lib/api/client';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function CommandBar({ totals }: { totals: WorkspaceOverview['totals'] }) {
  const stats = [
    { label: 'PROJECTS', value: totals.projects, color: '#c9a84c' },
    { label: 'ACTIVE', value: totals.activeMissions, color: '#c9a84c' },
    { label: 'STEPS DONE', value: totals.stepsDone, color: '#34d399' },
    { label: 'TOTAL', value: totals.steps, color: '#6b6e7a' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 bg-[#0a0b10] border border-[#1e2030] rounded-xl">
      {stats.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3">
          {i > 0 && <div className="hidden sm:block w-px h-6 bg-[#1e2030]" />}
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#4a4d5a] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.label}</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompletionGauge({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const pctDisplay = Math.round(pct * 100);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="relative flex flex-col items-center justify-center gap-2">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: pct > 0 ? '0 0 30px rgba(201,168,76,0.15), inset 0 0 20px rgba(201,168,76,0.05)' : 'none' }} />
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track ring */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1e2030" strokeWidth="4" />
          {/* Tick marks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = 60 + (r + 3) * Math.cos(rad);
            const y1 = 60 + (r + 3) * Math.sin(rad);
            const x2 = 60 + (r + 6) * Math.cos(rad);
            const y2 = 60 + (r + 6) * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1e2030" strokeWidth="1" />;
          })}
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke="url(#gaugeGrad)" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-1000"
            style={{ filter: pct > 0 ? 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' : 'none' }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a8872e" />
              <stop offset="100%" stopColor="#c9a84c" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl sm:text-4xl font-bold tabular-nums"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              background: 'linear-gradient(135deg, #c9a84c, #e8d48b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {pctDisplay}%
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-[#4a4d5a] font-medium mt-0.5">complete</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[#4a4d5a] uppercase tracking-[0.12em]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]" style={{ boxShadow: '0 0 6px rgba(201,168,76,0.6)' }} />
        <span>{done} of {total} steps</span>
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
      <div className="flex flex-col gap-8 items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#4a4d5a] font-medium">// initializing</span>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'linear-gradient(135deg, #c9a84c, #e8d48b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Operations Center
          </h1>
        </div>
        {error ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : <Spinner />}
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
    { key: 'all' as const, label: 'ALL', count: totals.missions },
    { key: 'active' as const, label: 'ACTIVE', count: totals.activeMissions },
    { key: 'completed' as const, label: 'DONE', count: completedMissions },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#4a4d5a] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>// operations center</span>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              background: 'linear-gradient(135deg, #d0ccc4, #c9a84c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
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
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Command Bar + Gauge — desktop: side by side */}
      {workspace && (
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Stats + gauge panel */}
          <div
            className="flex-1 flex flex-col sm:flex-row items-center gap-6 px-5 py-5 rounded-xl border border-[#1e2030] relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0e0f16 0%, #12131a 50%, #0e0f16 100%)',
              boxShadow: '0 0 40px rgba(201,168,76,0.03), inset 0 1px 0 rgba(201,168,76,0.05)',
            }}
          >
            {/* Subtle corner accents */}
            <div className="absolute top-0 left-0 w-16 h-px bg-gradient-to-r from-[#c9a84c]/30 to-transparent" />
            <div className="absolute top-0 left-0 w-px h-16 bg-gradient-to-b from-[#c9a84c]/30 to-transparent" />
            <div className="absolute bottom-0 right-0 w-16 h-px bg-gradient-to-l from-[#c9a84c]/30 to-transparent" />
            <div className="absolute bottom-0 right-0 w-px h-16 bg-gradient-to-t from-[#c9a84c]/30 to-transparent" />

            {/* Stat blocks */}
            <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-6 w-full sm:w-auto relative">
              {[
                { label: 'LIVE PROJECTS', value: totals.projects, icon: FolderKanban, color: '#c9a84c' },
                { label: 'ACTIVE MISSIONS', value: totals.activeMissions, icon: Zap, color: '#c9a84c' },
                { label: 'COMPLETED', value: completedMissions, icon: CheckCircle2, color: '#34d399' },
                { label: 'TOTAL STEPS', value: totals.steps, icon: Target, color: '#6b6e7a' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <s.icon size={11} className="text-[#4a4d5a]" />
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#4a4d5a] font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>{s.label}</span>
                  </div>
                  <span className="text-3xl sm:text-4xl font-bold tabular-nums" style={{ fontFamily: "'Cormorant Garamond', serif", color: s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-gradient-to-b from-transparent via-[#1e2030] to-transparent" />

            {/* Completion gauge */}
            <CompletionGauge done={totals.stepsDone} total={totals.steps} />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {workspace && projects.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-[#0a0b10] border border-[#1e2030] rounded-xl w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-[0.14em] font-semibold transition-all min-h-[36px] flex items-center gap-2 ${
                filter === f.key
                  ? 'text-[#c9a84c] border border-[#c9a84c]/30'
                  : 'text-[#4a4d5a] hover:text-[#b8b4ac] border border-transparent'
              }`}
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: filter === f.key ? 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.03))' : 'transparent',
                boxShadow: filter === f.key ? '0 0 12px rgba(201,168,76,0.08)' : 'none',
              }}
            >
              {f.label}
              <span className={`text-[9px] tabular-nums ${filter === f.key ? 'text-[#c9a84c]/60' : 'text-[#2a2d3a]'}`}>{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* No workspace */}
      {!workspace && (
        <div
          className="flex flex-col items-center justify-center gap-5 py-20 rounded-xl border border-[#1e2030] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0e0f16, #12131a)' }}
        >
          <div className="absolute top-0 left-0 w-24 h-px bg-gradient-to-r from-[#c9a84c]/20 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-24 bg-gradient-to-b from-[#c9a84c]/20 to-transparent" />
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)', boxShadow: '0 0 30px rgba(201,168,76,0.1)' }}>
            <FolderKanban size={28} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-[#b8b4ac]">No workspace configured</span>
            <a href="/onboarding" className="text-sm text-[#c9a84c] hover:underline font-medium">Initialize workspace</a>
          </div>
        </div>
      )}

      {addingProject && (
        <NewProjectForm
          onCreate={(name, priority) => send('POST', '/api/projects', { name, priority })}
          onCancel={() => setAddingProject(false)}
        />
      )}

      {/* Empty state */}
      {workspace && projects.length === 0 && !addingProject && (
        <div
          className="flex flex-col items-center justify-center gap-5 py-20 rounded-xl border border-dashed border-[#1e2030] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0e0f16, #12131a)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)' }}>
            <Plus size={24} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm text-[#4a4d5a]">No projects in the system</span>
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
      <div className="flex flex-col gap-6">
        {filteredProjects.map((project, idx) => (
          <ProjectSection key={project.id} project={project} index={idx} pendingSteps={pending} actions={actions} />
        ))}
      </div>

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
