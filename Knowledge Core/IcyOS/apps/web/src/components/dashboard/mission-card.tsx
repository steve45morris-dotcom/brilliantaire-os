'use client';

import { useState } from 'react';
import { Trash2, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { EditableText } from './editable-text';
import { AddStepInput } from './forms';
import { MiniGauge, SegmentBar, GOLD, GREEN } from './hud';
import type { MissionView, StepView } from '../../lib/workspace/overview';

type StatusStyle = { chip: string; dot: string; border: string; glow: string; bar: string; pulse?: string };

const STATUS: Record<string, StatusStyle> = {
  Staged:    { chip: 'text-[#8a8d9a] border-[#2a2d3a] bg-[#12131a]', dot: '#6b6e7a', border: '#1e2030', glow: 'none', bar: '#6b6e7a' },
  Approved:  { chip: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10', dot: '#22d3ee', border: 'rgba(34,211,238,0.2)', glow: '0 0 20px rgba(34,211,238,0.05)', bar: '#22d3ee' },
  Running:   { chip: 'text-[#c9a84c] border-[#c9a84c]/35 bg-[#c9a84c]/10', dot: GOLD, border: 'rgba(201,168,76,0.3)', glow: '0 0 26px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.12)', bar: GOLD, pulse: 'hud-pulse-gold' },
  Completed: { chip: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10', dot: GREEN, border: 'rgba(52,211,153,0.18)', glow: '0 0 18px rgba(52,211,153,0.05)', bar: GREEN },
  Skipped:   { chip: 'text-[#4a4d5a] border-[#1e2030] bg-[#0e0f16]', dot: '#4a4d5a', border: '#1e2030', glow: 'none', bar: '#4a4d5a' },
  Failed:    { chip: 'text-red-300 border-red-500/30 bg-red-500/10', dot: '#ef4444', border: 'rgba(239,68,68,0.2)', glow: '0 0 20px rgba(239,68,68,0.05)', bar: '#ef4444' },
};

const STEP_PREVIEW = 12;

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
  index,
  pendingSteps,
  actions,
}: {
  mission: MissionView;
  index: number;
  pendingSteps: Set<string>;
  actions: MissionCardActions;
}) {
  const s = STATUS[mission.status] ?? STATUS.Staged;
  const isComplete = mission.status === 'Completed';
  const isRunning = mission.status === 'Running';
  const id = `M-${String(index + 1).padStart(2, '0')}`;
  const remaining = mission.steps.length - mission.stepsDone;
  const [expanded, setExpanded] = useState(false);
  const collapsible = mission.steps.length > STEP_PREVIEW;
  const visibleSteps = collapsible && !expanded ? mission.steps.slice(0, STEP_PREVIEW) : mission.steps;
  const hidden = mission.steps.length - visibleSteps.length;

  return (
    <div
      className="relative h-full flex flex-col rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)',
        border: `1px solid ${s.border}`,
        boxShadow: s.glow,
      }}
    >
      {(isRunning || isComplete) && (
        <span
          aria-hidden
          className="absolute top-0 left-5 right-5 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${s.bar}99, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2.5">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap font-tactical">
            <span className="text-[9px] tracking-[0.16em] text-[#4a4d5a]">{id}</span>
            <span className={`inline-flex items-center gap-1.5 px-1.5 py-[2px] rounded-[3px] text-[9px] uppercase tracking-[0.14em] font-semibold border ${s.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.pulse ?? ''}`} style={{ background: s.dot, boxShadow: `0 0 6px ${s.dot}99` }} />
              {mission.status}
            </span>
            {mission.estimatedMinutes != null && (
              <span className="inline-flex items-center gap-1 text-[9px] tracking-[0.08em] text-[#4a4d5a]">
                <Clock size={9} />
                {formatMinutes(mission.estimatedMinutes)}
              </span>
            )}
            {mission.sprintName && (
              <span className="text-[9px] uppercase tracking-[0.12em] text-[#2f3240]">{mission.sprintName}</span>
            )}
          </div>

          <EditableText
            value={mission.name}
            label={`mission ${mission.name}`}
            onSave={(name) => actions.renameMission(mission.id, name)}
            className="font-semibold text-[#e0dcd2]"
          >
            <span className="min-w-0 break-words font-semibold text-[15px] leading-snug text-[#e0dcd2]">
              {mission.name}
            </span>
          </EditableText>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
          {mission.steps.length > 0 && <MiniGauge done={mission.stepsDone} total={mission.steps.length} size={30} stroke={2.5} />}
          <button
            type="button"
            aria-label={`Delete mission ${mission.name}`}
            onClick={() => actions.deleteMission(mission)}
            className="text-[#4a4d5a] hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Segment progress */}
      {mission.steps.length > 0 && (
        <div className="flex items-center gap-3 px-4 pb-2.5">
          <div className="flex-1"><SegmentBar done={mission.stepsDone} total={mission.steps.length} color={isComplete ? GREEN : GOLD} height={3} /></div>
          <span className="font-tactical text-[10px] tabular-nums text-[#4a4d5a] shrink-0">
            <span className="text-[#b8b4ac]">{mission.stepsDone}</span>/{mission.steps.length}
            {remaining > 0 && <span className="ml-2 text-[#2f3240] tracking-[0.1em]">{remaining} LEFT</span>}
          </span>
        </div>
      )}

      {/* Steps */}
      {mission.steps.length > 0 && (
        <ul className="flex flex-col px-2 border-t border-[#1e2030]/70">
          {visibleSteps.map((step, i) => (
            <li
              key={step.id}
              className={`group/step flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-[#13141c] transition-colors ${i > 0 ? 'border-t border-[#1e2030]/40' : ''}`}
            >
              <input
                type="checkbox"
                className="tac-check"
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
                <span className={`min-w-0 break-words text-[13px] leading-snug transition-colors ${step.completedAt ? 'text-[#4a4d5a] line-through decoration-[#2a2d3a]' : 'text-[#c4c0b8]'}`}>
                  {step.command}
                </span>
              </EditableText>
              <button
                type="button"
                aria-label={`Delete step ${step.command}`}
                onClick={() => actions.deleteStep(step)}
                className="shrink-0 text-[#4a4d5a] hover:text-red-400 opacity-100 md:opacity-0 md:group-hover/step:opacity-100 focus:opacity-100 transition-opacity min-w-[30px] min-h-[30px] flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </li>
          ))}
          {collapsible && (
            <li className="border-t border-[#1e2030]/40">
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="font-tactical w-full flex items-center justify-center gap-1.5 py-2 text-[9px] tracking-[0.16em] text-[#6b6e7a] hover:text-[#c9a84c] transition-colors"
              >
                {expanded ? <><ChevronUp size={11} /> COLLAPSE</> : <><ChevronDown size={11} /> SHOW ALL {mission.steps.length} · {hidden} HIDDEN</>}
              </button>
            </li>
          )}
        </ul>
      )}

      {mission.steps.length < 50 && (
        <div className={`mt-auto px-2 pb-2 ${mission.steps.length > 0 ? 'pt-1' : 'pt-0 border-t border-[#1e2030]/70'}`}>
          <AddStepInput onAdd={(text) => actions.addStep(mission.id, text)} />
        </div>
      )}
    </div>
  );
}
