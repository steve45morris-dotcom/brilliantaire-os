'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PendingDelete } from '../../../components/dashboard/confirm-delete';
import type { ProjectActions } from '../../../components/dashboard/project-section';
import { SELECT_PROJECT_EVENT } from '../../../components/layout/command-palette';
import { CommandHero } from '../../../components/daylight/command-hero';
import { CurrentMission } from '../../../components/daylight/current-mission';
import { DaylightConfirm } from '../../../components/daylight/daylight-confirm';
import { DaylightBottomNav, DaylightTopBar } from '../../../components/daylight/daylight-nav';
import { useSound } from '../../../components/daylight/daylight-fx';
import { ProjectCards } from '../../../components/daylight/project-cards';
import { ThisWeek, UpNext } from '../../../components/daylight/side-panels';
import { sans, serif } from '../../../components/daylight/fonts';
import s from '../../../components/daylight/daylight.module.css';
import { apiFetch } from '../../../lib/api/client';
import { ACTIVE_STATUSES, featuredMission, type UpNextFilter } from '../../../lib/workspace/daylight';
import type { MissionView, SetStepResult, WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const ACTIVE = ACTIVE_STATUSES;

export default function DashboardPage() {
  const [overview, setOverview] = useState<WorkspaceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [addingProject, setAddingProject] = useState(false);
  const [confirming, setConfirming] = useState<PendingDelete | null>(null);
  const [upFilter, setUpFilter] = useState<UpNextFilter>('all');
  const [openMissionId, setOpenMissionId] = useState<string | null>(null);
  const [missionFor, setMissionFor] = useState<string | null>(null);
  const sound = useSound();
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

  // ?project= from the command palette wins the first time projects arrive.
  const askedProject = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (projects.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (askedProject.current === undefined) {
      askedProject.current = new URLSearchParams(window.location.search).get('project');
      if (askedProject.current && projects.some((p) => p.id === askedProject.current)) {
        setSelectedId(askedProject.current);
        return;
      }
    }
    if (!selectedId || !projects.some((p) => p.id === selectedId)) setSelectedId(projects[0].id);
  }, [projects, selectedId]);

  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (projects.some((p) => p.id === id)) setSelectedId(id);
    };
    window.addEventListener(SELECT_PROJECT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_PROJECT_EVENT, onSelect);
  }, [projects]);

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
  const featured = featuredMission(selected);
  // A mission opened from Up next overrides the featured rule until another project is picked.
  const opened = selected?.missions.find((m) => m.id === openMissionId) ?? null;
  const shown = opened ?? featured;

  const selectProject = (id: string) => {
    setSelectedId(id);
    setOpenMissionId(null);
  };

  const frame = `${s.root} ${serif.variable} ${sans.variable}`;

  if (!overview) {
    return (
      <div className={frame} onPointerDownCapture={sound.onPointerDown}>
        <DaylightTopBar soundOn={sound.on} onToggleSound={sound.toggle} />
        <main>
          <section className={s.hero} aria-busy={!error}>
            <p className={s.meta}>IcyOS</p>
            <h1 className={s.h1}>{error ? 'Your workspace did not load' : 'Opening your workspace…'}</h1>
            {error && (
              <p role="alert" className={s.error} style={{ marginTop: 18 }}>
                {error}
              </p>
            )}
          </section>
        </main>
        <DaylightBottomNav />
      </div>
    );
  }

  const { workspace, totals } = overview;

  return (
    <div className={frame} onPointerDownCapture={sound.onPointerDown}>
      <DaylightTopBar soundOn={sound.on} onToggleSound={sound.toggle} />

      <main>
        {!workspace ? (
          <section className={s.hero}>
            <h1 className={s.h1}>Set up your workspace</h1>
            <p className={s.sub}>IcyOS needs a workspace before it can plan anything.</p>
            <a href="/onboarding" className={`${s.btn} ${s.btnDark}`} style={{ marginTop: 20 }}>
              Start setup
            </a>
          </section>
        ) : (
          <CommandHero
            workspaceName={workspace.name}
            projects={projects}
            steps={{ done: totals.stepsDone, total: totals.steps }}
            featured={featured}
            onNewMission={selected ? () => setMissionFor(selected.id) : null}
            onNewProject={() => setAddingProject(true)}
          />
        )}

        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}

        {workspace && (
          <div className={s.body}>
            {selected && (
              <CurrentMission
                key={`${selected.id}:${shown?.id ?? 'none'}`}
                mission={shown}
                project={selected}
                projectIndex={selectedIndex}
                pendingSteps={pending}
                actions={actions}
                onNewMission={() => setMissionFor(selected.id)}
                opened={Boolean(opened) && opened !== featured}
              />
            )}
            {projects.length > 0 && (
              <aside className={s.side}>
                <UpNext
                  projects={projects}
                  featuredId={shown?.id ?? null}
                  filter={upFilter}
                  onFilter={setUpFilter}
                  onOpen={(projectId, missionId) => {
                    setSelectedId(projectId);
                    setOpenMissionId(missionId);
                  }}
                />
                <ThisWeek activeMissions={totals.activeMissions} stepsDone={totals.stepsDone} steps={totals.steps} />
              </aside>
            )}
            <ProjectCards
              projects={projects}
              selectedId={selectedId}
              onSelect={selectProject}
              adding={addingProject}
              onAddProject={() => setAddingProject(true)}
              onCancelProject={() => setAddingProject(false)}
              onCreateProject={(name, priority) => send('POST', '/api/projects', { name, priority })}
              missionFor={missionFor}
              onAddMission={setMissionFor}
              actions={actions}
            />
          </div>
        )}
      </main>

      <DaylightBottomNav />
      <DaylightConfirm pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
