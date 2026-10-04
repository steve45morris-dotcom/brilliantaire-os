'use client';

import { Trash2, X } from 'lucide-react';
import { Card } from '../ui/card';
import { EditableText } from './editable-text';
import { AddStepInput } from './forms';
import type { MissionView, StepView } from '../../lib/workspace/overview';

const STATUS_STYLE: Record<string, string> = {
  Staged: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  Approved: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  Running: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  Completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Skipped: 'bg-zinc-900 text-zinc-500 border-zinc-800',
  Failed: 'bg-red-500/10 text-red-300 border-red-500/30',
};

/** 45 → "45 min", 90 → "1h 30m", 120 → "2h". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export interface MissionCardActions {
  toggleStep: (mission: MissionView, stepId: string, completed: boolean) => void;
  renameMission: (missionId: string, name: string) => Promise<boolean>;
  deleteMission: (mission: MissionView) => void;
  addStep: (missionId: string, text: string) => Promise<boolean>;
  renameStep: (stepId: string, text: string) => Promise<boolean>;
  deleteStep: (step: StepView) => Promise<boolean>;
}

export function MissionCard({
  mission,
  pendingSteps,
  actions,
}: {
  mission: MissionView;
  pendingSteps: Set<string>;
  actions: MissionCardActions;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <EditableText
            value={mission.name}
            label={`mission ${mission.name}`}
            onSave={(name) => actions.renameMission(mission.id, name)}
            className="font-semibold text-zinc-100"
          />
          <span className="text-xs text-zinc-500">
            {mission.sprintName}
            {mission.estimatedMinutes ? ` · ~${formatMinutes(mission.estimatedMinutes)}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_STYLE[mission.status] ?? STATUS_STYLE.Staged}`}
          >
            {mission.status}
          </span>
          <button
            type="button"
            aria-label={`Delete mission ${mission.name}`}
            onClick={() => actions.deleteMission(mission)}
            className="text-zinc-500 hover:text-red-400"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {mission.steps.length > 0 && (
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
      )}

      <ul className="flex flex-col gap-2">
        {mission.steps.map((step) => (
          <li key={step.id} className="group/step flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              aria-label={step.command}
              checked={Boolean(step.completedAt)}
              disabled={pendingSteps.has(step.id)}
              onChange={(e) => actions.toggleStep(mission, step.id, e.target.checked)}
            />
            <EditableText
              value={step.command}
              label={`step ${step.command}`}
              maxLength={512}
              onSave={(text) => actions.renameStep(step.id, text)}
              className="flex-1"
            >
              <span className={`min-w-0 break-words ${step.completedAt ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                {step.command}
              </span>
            </EditableText>
            <button
              type="button"
              aria-label={`Delete step ${step.command}`}
              onClick={() => actions.deleteStep(step)}
              className="shrink-0 mt-0.5 text-zinc-500 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover/step:opacity-100 focus:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      {mission.steps.length < 50 && <AddStepInput onAdd={(text) => actions.addStep(mission.id, text)} />}
    </Card>
  );
}
