'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EditableText } from './editable-text';
import { NewMissionForm, PrioritySelect } from './forms';
import { MissionCard, type MissionCardActions } from './mission-card';
import { CornerBrackets, MiniGauge } from './hud';
import type { Priority } from '@icyos/shared';
import type { MissionView, ProjectView } from '../../lib/workspace/overview';

export interface ProjectActions extends MissionCardActions {
  renameProject: (projectId: string, name: string) => Promise<boolean>;
  setPriority: (projectId: string, priority: Priority) => Promise<boolean>;
  deleteProject: (project: ProjectView) => void;
  createMission: (projectId: string, name: string, steps: string[]) => Promise<boolean>;
}

export type MissionFilter = 'all' | 'active' | 'completed';

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: '#ef4444',
  P2: '#c9a84c',
  P3: '#6b6e7a',
};

export function ProjectSection({
  project,
  index,
  missions,
  filter,
  onFilter,
  pendingSteps,
  actions,
}: {
  project: ProjectView;
  index: number;
  missions: MissionView[];
  filter: MissionFilter;
  onFilter: (f: MissionFilter) => void;
  pendingSteps: Set<string>;
  actions: ProjectActions;
}) {
  const [adding, setAdding] = useState(false);
  const totalSteps = project.missions.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = project.missions.reduce((n, m) => n + m.stepsDone, 0);
  const activeCount = project.missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status)).length;
  const doneCount = project.missions.length - activeCount;
  const pc = PRIORITY_COLOR[project.priority];
  const id = `PRJ-${String(index + 1).padStart(2, '0')}`;

  const FILTERS: { key: MissionFilter; label: string; count: number }[] = [
    { key: 'all', label: 'ALL', count: project.missions.length },
    { key: 'active', label: 'ACTIVE', count: activeCount },
    { key: 'completed', label: 'DONE', count: doneCount },
  ];

  return (
    <section
      className="relative rounded-lg overflow-hidden"
      aria-label={project.name}
      style={{
        background: 'linear-gradient(180deg, #0e0f16 0%, #0a0b10 100%)',
        border: '1px solid #1e2030',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.4)" size={16} />
      {/* Left accent rail */}
      <span aria-hidden className="absolute left-0 top-6 bottom-6 w-px" style={{ background: `linear-gradient(180deg, transparent, ${pc}cc, transparent)` }} />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 pt-4 pb-3 border-b border-[#1e2030]">
        <div className="flex items-center gap-3 min-w-0">
          <MiniGauge done={doneSteps} total={totalSteps} size={40} stroke={2.5} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2 font-tactical text-[10px] tracking-[0.16em]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc, boxShadow: `0 0 6px ${pc}99` }} />
              <span className="text-[#6b6e7a]">{id}</span>
              <span className="text-[#2a2d3a]">//</span>
              <span className="text-[#4a4d5a]">{doneSteps}/{totalSteps} STEPS</span>
            </div>
            <EditableText
              value={project.name}
              label={`project ${project.name}`}
              onSave={(name) => actions.renameProject(project.id, name)}
              className="text-lg font-semibold text-[#e8e4da]"
            >
              <span className="min-w-0 break-words text-lg font-semibold leading-tight text-[#e8e4da]">
                {project.name}
              </span>
            </EditableText>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Filter tabs */}
          <div className="flex items-center p-0.5 rounded-md border border-[#1e2030] bg-[#08090e]">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilter(f.key)}
                  className={`font-tactical px-2.5 py-1.5 rounded-[4px] text-[10px] tracking-[0.14em] font-semibold flex items-center gap-1.5 transition-all min-h-[32px] ${
                    on ? 'text-[#c9a84c]' : 'text-[#4a4d5a] hover:text-[#b8b4ac]'
                  }`}
                  style={{
                    background: on ? 'rgba(201,168,76,0.10)' : 'transparent',
                    boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.3)' : 'none',
                  }}
                >
                  {f.label}
                  <span className={`tabular-nums ${on ? 'text-[#c9a84c]/60' : 'text-[#2a2d3a]'}`}>{f.count}</span>
                </button>
              );
            })}
          </div>

          <PrioritySelect
            value={project.priority}
            label={`Priority of ${project.name}`}
            onChange={(p) => void actions.setPriority(project.id, p)}
          />
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="font-tactical inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-md text-[11px] tracking-[0.12em] font-semibold text-[#c9a84c] border border-[#c9a84c]/35 bg-[#c9a84c]/[0.06] hover:bg-[#c9a84c]/[0.12] transition-colors"
          >
            <Plus size={13} /> MISSION
          </button>
          <button
            type="button"
            aria-label={`Delete project ${project.name}`}
            onClick={() => actions.deleteProject(project)}
            className="text-[#4a4d5a] hover:text-red-400 min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-5">
        {adding && (
          <NewMissionForm
            projectName={project.name}
            onCreate={(name, steps) => actions.createMission(project.id, name, steps)}
            onCancel={() => setAdding(false)}
          />
        )}

        {project.missions.length === 0 && !adding && (
          <div className="flex items-center justify-center gap-2 py-10 border border-dashed border-[#1e2030] rounded-md bg-[#08090e]/60">
            <span className="font-tactical text-[11px] tracking-[0.12em] text-[#4a4d5a]">NO MISSIONS</span>
            <button type="button" onClick={() => setAdding(true)} className="font-tactical text-[11px] tracking-[0.12em] text-[#c9a84c] hover:underline">
              ADD ONE
            </button>
          </div>
        )}

        {project.missions.length > 0 && missions.length === 0 && (
          <div className="flex items-center justify-center py-10 font-tactical text-[11px] tracking-[0.12em] text-[#4a4d5a]">
            NO {filter === 'active' ? 'ACTIVE' : 'COMPLETED'} MISSIONS
          </div>
        )}

        {missions.length > 0 && (
          <div className="grid gap-3 lg:grid-cols-2">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                index={project.missions.findIndex((m) => m.id === mission.id)}
                pendingSteps={pendingSteps}
                actions={actions}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
