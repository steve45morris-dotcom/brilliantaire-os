'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { EditableText } from './editable-text';
import { NewMissionForm, PrioritySelect, PRIORITY_LABELS } from './forms';
import { MissionCard, type MissionCardActions } from './mission-card';
import type { Priority } from '@icyos/shared';
import type { ProjectView } from '../../lib/workspace/overview';

export interface ProjectActions extends MissionCardActions {
  renameProject: (projectId: string, name: string) => Promise<boolean>;
  setPriority: (projectId: string, priority: Priority) => Promise<boolean>;
  deleteProject: (project: ProjectView) => void;
  createMission: (projectId: string, name: string, steps: string[]) => Promise<boolean>;
}

const PRIORITY_GLOW: Record<Priority, string> = {
  P1: '0 0 20px rgba(239,68,68,0.08)',
  P2: '0 0 20px rgba(201,168,76,0.08)',
  P3: 'none',
};

const PRIORITY_BORDER: Record<Priority, string> = {
  P1: 'rgba(239,68,68,0.15)',
  P2: 'rgba(201,168,76,0.12)',
  P3: '#1e2030',
};

const PRIORITY_DOT: Record<Priority, string> = {
  P1: '#ef4444',
  P2: '#c9a84c',
  P3: '#4a4d5a',
};

function ProjectGauge({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#1e2030" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={pct >= 1 ? '#34d399' : '#c9a84c'} strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-700"
          style={{ filter: pct > 0 ? `drop-shadow(0 0 4px ${pct >= 1 ? 'rgba(52,211,153,0.5)' : 'rgba(201,168,76,0.5)'})` : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-bold tabular-nums text-[#b8b4ac]">{total > 0 ? `${Math.round(pct * 100)}` : '—'}</span>
      </div>
    </div>
  );
}

export function ProjectSection({
  project,
  index,
  pendingSteps,
  actions,
}: {
  project: ProjectView;
  index: number;
  pendingSteps: Set<string>;
  actions: ProjectActions;
}) {
  const [adding, setAdding] = useState(false);
  const totalSteps = project.missions.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = project.missions.reduce((n, m) => n + m.stepsDone, 0);
  const activeMissions = project.missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status)).length;
  const projectNum = String(index + 1).padStart(2, '0');

  return (
    <section className="flex flex-col gap-4" aria-label={project.name}>
      {/* Project header */}
      <div
        className="flex flex-col gap-3 px-4 py-4 sm:px-5 rounded-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0e0f16 0%, #12131a 50%, #0e0f16 100%)',
          border: `1px solid ${PRIORITY_BORDER[project.priority]}`,
          boxShadow: PRIORITY_GLOW[project.priority],
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-12 h-px" style={{ background: `linear-gradient(to right, ${PRIORITY_DOT[project.priority]}40, transparent)` }} />
        <div className="absolute top-0 left-0 w-px h-12" style={{ background: `linear-gradient(to bottom, ${PRIORITY_DOT[project.priority]}40, transparent)` }} />

        {/* Top row: ID + priority + stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_DOT[project.priority], boxShadow: `0 0 8px ${PRIORITY_DOT[project.priority]}60` }} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#4a4d5a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              PRJ-{projectNum} · {PRIORITY_LABELS[project.priority]}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-[#4a4d5a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span><strong className="text-[#b8b4ac] text-xs font-bold tabular-nums">{project.missions.length}</strong> missions</span>
            <span className="text-[#1e2030]">|</span>
            <span><strong className="text-[#b8b4ac] text-xs font-bold tabular-nums">{activeMissions}</strong> active</span>
          </div>
        </div>

        {/* Name row + actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ProjectGauge done={doneSteps} total={totalSteps} />
            <EditableText
              value={project.name}
              label={`project ${project.name}`}
              onSave={(name) => actions.renameProject(project.id, name)}
              className="text-xl font-bold text-[#d0ccc4]"
            >
              <span className="min-w-0 break-words text-xl font-bold text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {project.name}
              </span>
            </EditableText>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <PrioritySelect
              value={project.priority}
              label={`Priority of ${project.name}`}
              onChange={(p) => void actions.setPriority(project.id, p)}
            />
            <Button variant="secondary" className="!px-3 !py-1 text-xs inline-flex items-center gap-1" onClick={() => setAdding(true)}>
              <Plus size={14} /> Mission
            </Button>
            <button
              type="button"
              aria-label={`Delete project ${project.name}`}
              onClick={() => actions.deleteProject(project)}
              className="p-1.5 text-[#4a4d5a] hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Project-level progress bar */}
        {totalSteps > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-[#0a0b10] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(doneSteps / totalSteps) * 100}%`,
                  background: doneSteps >= totalSteps
                    ? 'linear-gradient(90deg, #059669, #34d399)'
                    : 'linear-gradient(90deg, #a8872e, #c9a84c)',
                  boxShadow: doneSteps > 0
                    ? doneSteps >= totalSteps ? '0 0 10px rgba(52,211,153,0.4)' : '0 0 10px rgba(201,168,76,0.3)'
                    : 'none',
                }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-[#4a4d5a] shrink-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {doneSteps}/{totalSteps}
            </span>
          </div>
        )}
      </div>

      {adding && (
        <NewMissionForm
          projectName={project.name}
          onCreate={(name, steps) => actions.createMission(project.id, name, steps)}
          onCancel={() => setAdding(false)}
        />
      )}

      {project.missions.length === 0 && !adding && (
        <div className="flex items-center justify-center gap-2 py-10 border border-dashed border-[#1e2030] rounded-xl bg-[#0a0b10]/50">
          <span className="text-sm text-[#4a4d5a]">No missions.</span>
          <button type="button" onClick={() => setAdding(true)} className="text-sm text-[#c9a84c] hover:underline font-medium">
            Add one
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {project.missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} pendingSteps={pendingSteps} actions={actions} />
        ))}
      </div>
    </section>
  );
}
