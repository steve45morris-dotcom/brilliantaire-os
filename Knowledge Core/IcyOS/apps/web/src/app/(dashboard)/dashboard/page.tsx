'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Spinner } from '../../../components/ui/spinner';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { NewProjectForm } from '../../../components/dashboard/forms';
import { ProjectSection, type ProjectActions, type MissionFilter } from '../../../components/dashboard/project-section';
import { ProjectTile } from '../../../components/dashboard/project-tile';
import { CornerBrackets, SegmentBar, SystemClock, useCountUp, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const ACTIVE = new Set(['Staged', 'Approved', 'Running']);

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-6 md:-inset-8 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,168,76,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.09), transparent 70%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,9,14,0.9), transparent 70%)' }}
      />
    </div>
  );
}

function Readout({ label, value, color = '#e0dcd2' }: { label: string; value: number; color?: string }) {
  const v = useCountUp(value);
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="font-tactical text-[9px] tracking-[0.2em] text-[#4a4d5a] whitespace-nowrap">{label}</span>
      <span className="font-tactical text-[28px] leading-none font-semibold tabular-nums" style={{ color, textShadow: color === GOLD ? '0 0 18px rgba(201,168,76,0.35)' : 'none' }}>
        {String(v).padStart(2, '0')}
      </span>
    </div>
  );
}

function MasterGauge({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const shown = useCountUp(Math.round(pct * 100));
  const r = 50;
  const circ = 2 * Math.PI * r;
  const ticks = 60;
  return (
    <div className="relative w-[148px] h-[148px] shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: pct > 0 ? '0 0 40px rgba(201,168,76,0.12), inset 0 0 30px rgba(201,168,76,0.04)' : 'none' }} />
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="masterGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8c6e23" />
            <stop offset="55%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#ebdcaa" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks }).map((_, i) => {
          const a = (i / ticks) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = 56.5;
          const r2 = major ? 60.5 : 58.5;
          const lit = i / ticks < pct;
          return (
            <line
              key={i}
              x1={60 + r1 * Math.cos(a)} y1={60 + r1 * Math.sin(a)}
              x2={60 + r2 * Math.cos(a)} y2={60 + r2 * Math.sin(a)}
              stroke={lit ? GOLD : major ? '#2a2d3a' : '#1e2030'}
              strokeWidth={major ? 1.2 : 0.8}
              style={{ transition: 'stroke 0.5s' }}
            />
          );
        })}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#14161e" strokeWidth="5" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#masterGrad)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          className="transition-all duration-1000"
          style={{ filter: pct > 0 ? 'drop-shadow(0 0 7px rgba(201,168,76,0.6))' : 'none' }}
        />
        <circle cx="60" cy="60" r="41" fill="none" stroke="#14161e" strokeWidth="0.6" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-start leading-none">
          <span
            className="font-tactical font-bold tabular-nums text-[34px] leading-none"
            style={{ background: 'linear-gradient(180deg, #ebdcaa, #c9a84c 60%, #a8872e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {shown}
          </span>
          <span className="font-tactical text-[12px] text-[#c9a84c] mt-[3px] ml-0.5">%</span>
        </div>
        <span className="font-tactical text-[8px] tracking-[0.26em] text-[#4a4d5a] mt-1.5">COMPLETE</span>
      </div>
    </div>
  );
}

function InstrumentCluster({
  totals,
  sprint,
  canAdd,
  onAdd,
}: {
  totals: WorkspaceOverview['totals'];
  sprint: string;
  canAdd: boolean;
  onAdd: () => void;
}) {
  const completed = totals.missions - totals.activeMissions;
  const running = totals.activeMissions > 0;
  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="hud-scan" />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-6 lg:gap-8 px-5 sm:px-6 py-5">
        {/* Gauge */}
        <div className="flex items-center justify-center lg:justify-start">
          <MasterGauge done={totals.stepsDone} total={totals.steps} />
        </div>

        {/* Readouts */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
            <Readout label="PROJECTS" value={totals.projects} />
            <Readout label="ACTIVE MISSIONS" value={totals.activeMissions} color={GOLD} />
            <Readout label="COMPLETED" value={completed} color={GREEN} />
            <Readout label="TOTAL STEPS" value={totals.steps} color="#8a8d9a" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1"><SegmentBar done={totals.stepsDone} total={totals.steps} height={5} maxSegments={60} /></div>
            <span className="font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a] whitespace-nowrap">
              <span className="text-[#b8b4ac]">{totals.stepsDone}</span>/{totals.steps} STEPS
            </span>
          </div>
        </div>

        {/* System readout */}
        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:border-l lg:border-[#1e2030] lg:pl-8">
          <SystemClock />
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 font-tactical text-[10px] tracking-[0.16em]">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? 'hud-pulse-green' : ''}`} style={{ background: running ? GREEN : '#4a4d5a', boxShadow: running ? '0 0 6px rgba(52,211,153,0.8)' : 'none' }} />
              <span className={running ? 'text-emerald-300' : 'text-[#4a4d5a]'}>{running ? 'SYSTEMS NOMINAL' : 'STANDBY'}</span>
            </div>
            <span className="font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a]">
              SPRINT <span className="text-[#b8b4ac]">{sprint}</span>
            </span>
            {canAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="font-tactical mt-1 inline-flex items-center gap-1.5 px-3.5 min-h-[36px] rounded-md text-[11px] tracking-[0.14em] font-semibold text-[#08090e] transition-all"
                style={{ background: 'linear-gradient(180deg, #dcc878, #c9a84c)', boxShadow: '0 0 20px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.3)' }}
              >
                <Plus size={13} /> NEW PROJECT
              </button>
            )}
          </div>
        </div>
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
  const [filter, setFilter] = useState<MissionFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await apiFetch<WorkspaceOverview>('/api/workspace');
    if (res.success && res.data) setOverview(res.data);
    else setError(res.error?.message ?? 'Could not load your workspace');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const projects = overview?.projects ?? [];

  useEffect(() => {
    if (projects.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !projects.some((p) => p.id === selectedId)) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

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
      const nextProjects = prev.projects.map((p) => ({
        ...p,
        missions: p.missions.map((m) => (m.id === missionId ? change(m) : m)),
      }));
      const missions = nextProjects.flatMap((p) => p.missions);
      return {
        ...prev,
        projects: nextProjects,
        totals: {
          ...prev.totals,
          activeMissions: missions.filter((m) => ACTIVE.has(m.status)).length,
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

  const selectedIndex = projects.findIndex((p) => p.id === selectedId);
  const selected = selectedIndex >= 0 ? projects[selectedIndex] : null;

  const visibleMissions = useMemo(() => {
    if (!selected) return [];
    if (filter === 'all') return selected.missions;
    return selected.missions.filter((m) => (filter === 'active' ? ACTIVE.has(m.status) : !ACTIVE.has(m.status)));
  }, [selected, filter]);

  const sprint = useMemo(() => {
    const all = projects.flatMap((p) => p.missions);
    return all.find((m) => m.status === 'Running')?.sprintName ?? all[0]?.sprintName ?? '—';
  }, [projects]);

  if (!overview) {
    return (
      <div className="relative flex flex-col gap-8 items-center justify-center min-h-[60vh]">
        <Backdrop />
        <div className="flex flex-col items-center gap-2">
          <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// INITIALIZING</span>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif", background: 'linear-gradient(135deg, #c9a84c, #e8d48b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Operations Center
          </h1>
        </div>
        {error ? (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <AlertCircle size={14} className="text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : <Spinner />}
      </div>
    );
  }

  const { workspace, totals } = overview;

  return (
    <div className="relative flex flex-col gap-5">
      <Backdrop />

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-tactical text-[10px] tracking-[0.3em] text-[#6b6e7a]">
            <span className="text-[#c9a84c]">//</span> OPERATIONS CENTER
          </span>
          <h1
            className="text-3xl sm:text-[2.6rem] font-bold tracking-tight leading-none"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              background: 'linear-gradient(135deg, #e8e4da 0%, #c9a84c 70%, #a8872e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {workspace?.name ?? 'Dashboard'}
          </h1>
        </div>
        {workspace && (
          <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">
            {String(projects.length).padStart(2, '0')} PROJECTS · {String(totals.missions).padStart(2, '0')} MISSIONS
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {workspace && (
        <InstrumentCluster totals={totals} sprint={sprint} canAdd={!addingProject} onAdd={() => setAddingProject(true)} />
      )}

      {!workspace && (
        <div className="relative flex flex-col items-center justify-center gap-5 py-20 rounded-lg border border-[#1e2030] overflow-hidden" style={{ background: 'linear-gradient(180deg, #0e0f16, #0a0b10)' }}>
          <CornerBrackets />
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', boxShadow: '0 0 30px rgba(201,168,76,0.1)' }}>
            <Plus size={28} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-tactical text-[11px] tracking-[0.14em] text-[#b8b4ac]">NO WORKSPACE CONFIGURED</span>
            <a href="/onboarding" className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">INITIALIZE WORKSPACE</a>
          </div>
        </div>
      )}

      {addingProject && (
        <NewProjectForm
          onCreate={(name, priority) => send('POST', '/api/projects', { name, priority })}
          onCancel={() => setAddingProject(false)}
        />
      )}

      {workspace && projects.length === 0 && !addingProject && (
        <div className="relative flex flex-col items-center justify-center gap-5 py-20 rounded-lg border border-dashed border-[#1e2030] overflow-hidden" style={{ background: 'linear-gradient(180deg, #0e0f16, #0a0b10)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }}>
            <Plus size={24} className="text-[#c9a84c]" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-tactical text-[11px] tracking-[0.14em] text-[#4a4d5a]">NO PROJECTS IN THE SYSTEM</span>
            <button type="button" onClick={() => setAddingProject(true)} className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">
              CREATE YOUR FIRST PROJECT
            </button>
          </div>
        </div>
      )}

      {/* Bento tiles */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="font-tactical text-[10px] tracking-[0.24em] text-[#4a4d5a]">PROJECT GRID</span>
            <span className="flex-1 h-px bg-gradient-to-r from-[#1e2030] to-transparent" />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p, i) => (
              <ProjectTile key={p.id} project={p} index={i} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <span className="font-tactical text-[10px] tracking-[0.24em] text-[#4a4d5a]">TARGET DETAIL</span>
            <span className="flex-1 h-px bg-gradient-to-r from-[#1e2030] to-transparent" />
          </div>
          <ProjectSection
            key={selected.id}
            project={selected}
            index={selectedIndex}
            missions={visibleMissions}
            filter={filter}
            onFilter={setFilter}
            pendingSteps={pending}
            actions={actions}
          />
        </div>
      )}

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
