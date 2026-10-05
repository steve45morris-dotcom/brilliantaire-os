'use client';

import { Trash2, X, Clock, CheckCircle2 } from 'lucide-react';
import { EditableText } from './editable-text';
import { AddStepInput } from './forms';
import type { MissionView, StepView } from '../../lib/workspace/overview';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Staged:    { bg: 'bg-[#1e2030]',        text: 'text-[#6b6e7a]',   border: 'border-[#2a2d3a]', dot: 'bg-[#6b6e7a]' },
  Approved:  { bg: 'bg-cyan-500/10',      text: 'text-cyan-300',     border: 'border-cyan-500/30', dot: 'bg-cyan-400' },
  Running:   { bg: 'bg-[#c9a84c]/10',     text: 'text-[#c9a84c]',   border: 'border-[#c9a84c]/30', dot: 'bg-[#c9a84c]' },
  Completed: { bg: 'bg-emerald-500/10',   text: 'text-emerald-300',  border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  Skipped:   { bg: 'bg-[#12131a]',        text: 'text-[#4a4d5a]',   border: 'border-[#1e2030]', dot: 'bg-[#4a4d5a]' },
  Failed:    { bg: 'bg-red-500/10',        text: 'text-red-300',      border: 'border-red-500/30', dot: 'bg-red-400' },
};

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

function MiniDonut({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const r = 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90 shrink-0">
      <circle cx="10" cy="10" r={r} fill="none" stroke="#1e2030" strokeWidth="2.5" />
      <circle
        cx="10" cy="10" r={r} fill="none"
        stroke={pct >= 1 ? '#34d399' : '#c9a84c'} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  );
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
  const cfg = STATUS_CONFIG[mission.status] ?? STATUS_CONFIG.Staged;
  const isComplete = mission.status === 'Completed';

  return (
    <div className={`flex flex-col gap-3 px-4 py-4 bg-[#12131a] border rounded-xl transition-colors ${
      isComplete ? 'border-emerald-500/10' : mission.status === 'Running' ? 'border-[#c9a84c]/20' : 'border-[#1e2030]'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.1em] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${mission.status === 'Running' ? 'animate-pulse' : ''}`} />
              {mission.status}
            </span>
            {mission.estimatedMinutes && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#4a4d5a]">
                <Clock size={10} />
                {formatMinutes(mission.estimatedMinutes)}
              </span>
            )}
          </div>
          <EditableText
            value={mission.name}
            label={`mission ${mission.name}`}
            onSave={(name) => actions.renameMission(mission.id, name)}
            className="font-bold text-[#d0ccc4]"
          >
            <span className="min-w-0 break-words font-bold text-[#d0ccc4]" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem' }}>
              {mission.name}
            </span>
          </EditableText>
          <span className="text-[10px] uppercase tracking-[0.1em] text-[#4a4d5a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {mission.sprintName}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {mission.steps.length > 0 && <MiniDonut done={mission.stepsDone} total={mission.steps.length} />}
          <button
            type="button"
            aria-label={`Delete mission ${mission.name}`}
            onClick={() => actions.deleteMission(mission)}
            className="text-[#4a4d5a] hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {mission.steps.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#0e0f16] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(mission.stepsDone / mission.steps.length) * 100}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #059669, #34d399)'
                  : 'linear-gradient(90deg, #a8872e, #c9a84c)',
                boxShadow: mission.stepsDone > 0
                  ? isComplete ? '0 0 8px rgba(52,211,153,0.3)' : '0 0 8px rgba(201,168,76,0.3)'
                  : 'none',
              }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-[#4a4d5a] shrink-0 w-10 text-right">
            {mission.stepsDone}/{mission.steps.length}
          </span>
        </div>
      )}

      {/* Steps */}
      <ul className="flex flex-col gap-1.5">
        {mission.steps.map((step) => (
          <li key={step.id} className="group/step flex items-start gap-2 text-sm py-1 px-2 -mx-2 rounded-lg hover:bg-[#0e0f16]/60 transition-colors">
            <label className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 shrink-0 accent-[#c9a84c] w-4 h-4"
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
                <span className={`min-w-0 break-words ${step.completedAt ? 'text-[#4a4d5a] line-through' : 'text-[#b8b4ac]'}`}>
                  {step.command}
                </span>
              </EditableText>
            </label>
            {step.completedAt && (
              <CheckCircle2 size={12} className="mt-1.5 text-emerald-500/50 shrink-0 hidden sm:block" />
            )}
            <button
              type="button"
              aria-label={`Delete step ${step.command}`}
              onClick={() => actions.deleteStep(step)}
              className="shrink-0 mt-0.5 text-[#4a4d5a] hover:text-red-400 opacity-100 md:opacity-0 md:group-hover/step:opacity-100 focus:opacity-100 transition-opacity min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      {mission.steps.length < 50 && <AddStepInput onAdd={(text) => actions.addStep(mission.id, text)} />}
    </div>
  );
}
