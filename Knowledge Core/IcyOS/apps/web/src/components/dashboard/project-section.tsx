'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { EditableText } from './editable-text';
import { NewMissionForm, PrioritySelect } from './forms';
import { MissionCard, type MissionCardActions } from './mission-card';
import type { Priority } from '@icyos/shared';
import type { ProjectView } from '../../lib/workspace/overview';

export interface ProjectActions extends MissionCardActions {
  renameProject: (projectId: string, name: string) => Promise<boolean>;
  setPriority: (projectId: string, priority: Priority) => Promise<boolean>;
  deleteProject: (project: ProjectView) => void;
  createMission: (projectId: string, name: string, steps: string[]) => Promise<boolean>;
}

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

  return (
    <section className="flex flex-col gap-3" aria-label={project.name}>
      <div className="flex flex-wrap items-center gap-2">
        <EditableText
          value={project.name}
          label={`project ${project.name}`}
          onSave={(name) => actions.renameProject(project.id, name)}
          className="text-lg font-semibold text-[#d0ccc4]"
        />
        <PrioritySelect
          value={project.priority}
          label={`Priority of ${project.name}`}
          onChange={(p) => void actions.setPriority(project.id, p)}
        />
        <div className="ml-auto flex items-center gap-1">
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

      {adding && (
        <NewMissionForm
          projectName={project.name}
          onCreate={(name, steps) => actions.createMission(project.id, name, steps)}
          onCancel={() => setAdding(false)}
        />
      )}

      {project.missions.length === 0 && !adding && (
        <Card className="border-dashed text-sm text-[#4a4d5a]">
          No missions yet.{' '}
          <button type="button" onClick={() => setAdding(true)} className="text-[#c9a84c] hover:underline">
            Add one
          </button>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {project.missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} pendingSteps={pendingSteps} actions={actions} />
        ))}
      </div>
    </section>
  );
}
