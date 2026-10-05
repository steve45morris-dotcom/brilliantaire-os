'use client';

import { Trash2, X, Clock, CheckCircle2 } from 'lucide-react';
import { EditableText } from './editable-text';
import { AddStepInput } from './forms';
import type { MissionView, StepView } from '../../lib/workspace/overview';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string; glow: string; cardBorder: string; cardGlow: string }> = {
  Staged:    { bg: 'bg-[#1e2030]',        text: 'text-[#6b6e7a]',   border: 'border-[#2a2d3a]', dot: 'bg-[#6b6e7a]', glow: '', cardBorder: '#1e2030', cardGlow: 'none' },
  Approved:  { bg: 'bg-cyan-500/10',      text: 'text-cyan-300',     border: 'border-cyan-500/30', dot: 'bg-cyan-400', glow: '0 0 6px rgba(34,211,238,0.4)', cardBorder: 'rgba(34,211,238,0.15)', cardGlow: '0 0 20px rgba(34,211,238,0.05)' },
  Running:   { bg: 'bg-[#c9a84c]/10',     text: 'text-[#c9a84c]',   border: 'border-[#c9a84c]/30', dot: 'bg-[#c9a84c]', glow: '0 0 6px rgba(201,168,76,0.5)', cardBorder: 'rgba(201,168,76,0.2)', cardGlow: '0 0 25px rgba(201,168,76,0.06)' },
  Completed: { bg: 'bg-emerald-500/10',   text: 'text-emerald-300',  border: 'border-emerald-500/30', dot: 'bg-emerald-400', glow: '0 0 6px rgba(52,211,153,0.4)', cardBorder: 'rgba(52,211,153,0.12)', cardGlow: '0 0 15px rgba(52,211,153,0.04)' },
  Skipped:   { bg: 'bg-[#12131a]',        text: 'text-[#4a4d5a]',   border: 'border-[#1e2030]', dot: 'bg-[#4a4d5a]', glow: '', cardBorder: '#1e2030', cardGlow: 'none' },
  Failed:    { bg: 'bg-red-500/10',        text: 'text-red-300',      border: 'border-red-500/30', dot: 'bg-red-400', glow: '0 0 6px rgba(239,68,68,0.4)', cardBorder: 'rgba(239,68,68,0.15)', cardGlow: '0 0 20px rgba(239,68,68,0.05)' },
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

function MiniDonut({ done, total, complete }: { done: number; total: number; complete: boolean }) {
  const pct = total > 0 ? done / total : 0;
  const r = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = complete ? '#34d399' : '#c9a84c';
  return (
    <div className="relative w-7 h-7 shrink-0">
      <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" stroke="#1e2030" strokeWidth="2" />
        <circle
          cx="12" cy="12" r={r} fill="none"
          stroke={color} strokeWidth="2" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          className="transition-all duration-500"
          style={{ filter: pct > 0 ? `drop-shadow(0 0 3px ${color}80)` : 'none' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold tabular-nums text-[#6b6e7a]">{done}</span>
      </div>
    </div>
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
  const isRunning = mission.status === 'Running';

  return (
    <div
      className="flex flex-col gap-3 px-4 py-4 rounded-xl relative overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, #12131a 0%, #0e0f16 100%)',
        border: `1px solid ${cfg.cardBorder}`,
        boxShadow: cfg.cardGlow,
      }}
    >
      {/* Top glow line for running missions */}
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a84c40, transparent)' }} />
      )}
      {isComplete && (
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #34d39940, transparent)' }} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          {/* Status + meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.12em] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span
                className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                style={{
                  boxShadow: cfg.glow,
                  animation: isRunning ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
                }}
              />
              {mission.status}
            </span>
            {mission.estimatedMinutes && (
              <span className="inline-flex items-center gap-1 text-[9px] text-[#4a4d5a]">
                <Clock size={9} />
                ~{formatMinutes(mission.estimatedMinutes)}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-[0.1em] text-[#2a2d3a]" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {mission.sprintName}
            </span>
          </div>

          {/* Mission name */}
          <EditableText
            value={mission.name}
            label={`mission ${mission.name}`}
            onSave={(name) => actions.renameMission(mission.id, name)}
            className="font-bold text-[#d0ccc4]"
          >
            <span className="min-w-0 break-words font-bold text-[#d0ccc4] text-base" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem' }}>
              {mission.name}
            </span>
          </EditableText>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-1">
          {mission.steps.length > 0 && <MiniDonut done={mission.stepsDone} total={mission.steps.length} complete={isComplete} />}
          <button
            type="button"
            aria-label={`Delete mission ${mission.name}`}
            onClick={() => actions.deleteMission(mission)}
            className="text-[#4a4d5a] hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {mission.steps.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#0a0b10] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(mission.stepsDone / mission.steps.length) * 100}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #059669, #34d399)'
                  : 'linear-gradient(90deg, #a8872e, #c9a84c)',
                boxShadow: mission.stepsDone > 0
                  ? isComplete ? '0 0 10px rgba(52,211,153,0.4)' : '0 0 10px rgba(201,168,76,0.35)'
                  : 'none',
              }}
            />
          </div>
          <span className="text-[9px] tabular-nums text-[#4a4d5a] shrink-0 w-10 text-right">
            {mission.stepsDone}/{mission.steps.length}
          </span>
        </div>
      )}

      {/* Steps */}
      {mission.steps.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {mission.steps.map((step) => (
            <li key={step.id} className="group/step flex items-start gap-2 text-sm py-1.5 px-2 -mx-2 rounded-lg hover:bg-[#0a0b10]/80 transition-colors">
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
                <span className={`min-w-0 break-words transition-colors ${step.completedAt ? 'text-[#4a4d5a] line-through' : 'text-[#b8b4ac]'}`}>
                  {step.command}
                </span>
              </EditableText>
              {step.completedAt && (
                <CheckCircle2 size={12} className="mt-1.5 text-emerald-500/40 shrink-0 hidden sm:block" />
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
      )}

      {mission.steps.length < 50 && <AddStepInput onAdd={(text) => actions.addStep(mission.id, text)} />}
    </div>
  );
}
