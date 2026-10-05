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

const PRIORITY_DOT: Record<Priority, string> = {
  P1: 'bg-red-400',
  P2: 'bg-[#c9a84c]',
  P3: 'bg-[#4a4d5a]',
};

export function ProjectSection({
  project,
  pendingSteps,
  actions,
}: {
  project: ProjectView;
  pendingSteps: Set<string>;
  actions: ProjectActions;
}) {
  const [adding, setAdding] = useState(false);
  const totalSteps = project.missions.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = project.missions.reduce((n, m) => n + m.stepsDone, 0);
  const activeMissions = project.missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status)).length;

  return (
    <section className="flex flex-col gap-4" aria-label={project.name}>
      {/* Project header card */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4 bg-[#12131a] border border-[#1e2030] rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority dot + project ID label */}
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[project.priority]}`} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[#4a4d5a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {PRIORITY_LABELS[project.priority]}
            </span>
          </div>

          <div className="flex-1 min-w-0" />

          {/* Inline stats */}
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[#4a4d5a] shrink-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span><strong className="text-[#b8b4ac] text-xs font-bold tabular-nums">{project.missions.length}</strong> missions</span>
            <span className="text-[#1e2030]">|</span>
            <span><strong className="text-[#b8b4ac] text-xs font-bold tabular-nums">{activeMissions}</strong> active</span>
            <span className="text-[#1e2030]">|</span>
            <span><strong className="text-[#b8b4ac] text-xs font-bold tabular-nums">{doneSteps}</strong>/{totalSteps} steps</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              className="p-1.5 text-[#4a4d5a] hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Project-level progress bar */}
        {totalSteps > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-[#1e2030] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(doneSteps / totalSteps) * 100}%`,
                  background: 'linear-gradient(90deg, #a8872e, #c9a84c)',
                  boxShadow: doneSteps > 0 ? '0 0 8px rgba(201,168,76,0.3)' : 'none',
                }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-[#4a4d5a] shrink-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {totalSteps > 0 ? `${Math.round((doneSteps / totalSteps) * 100)}%` : ''}
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
        <div className="flex items-center justify-center gap-2 py-8 border border-dashed border-[#1e2030] rounded-xl">
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
