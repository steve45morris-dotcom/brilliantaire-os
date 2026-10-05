'use client';

import type { Priority } from '@icyos/shared';
import type { ProjectView } from '../../lib/workspace/overview';
import { CornerBrackets, MiniGauge, SegmentBar } from './hud';

const PRIORITY_COLOR: Record<Priority, string> = {
  P1: '#ef4444',
  P2: '#c9a84c',
  P3: '#6b6e7a',
};

const PRIORITY_TAG: Record<Priority, string> = {
  P1: 'URGENT',
  P2: 'IMPORTANT',
  P3: 'SOMEDAY',
};

const STATUS_DOT: Record<string, string> = {
  Running: '#c9a84c',
  Approved: '#22d3ee',
  Staged: '#4a4d5a',
  Completed: '#34d399',
  Skipped: '#2a2d3a',
  Failed: '#ef4444',
};

export function ProjectTile({
  project,
  index,
  selected,
  onSelect,
}: {
  project: ProjectView;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const totalSteps = project.missions.reduce((n, m) => n + m.steps.length, 0);
  const doneSteps = project.missions.reduce((n, m) => n + m.stepsDone, 0);
  const running = project.missions.filter((m) => m.status === 'Running').length;
  const active = project.missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status)).length;
  const pc = PRIORITY_COLOR[project.priority];
  const id = `PRJ-${String(index + 1).padStart(2, '0')}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select project ${project.name}`}
      className="group relative w-full text-left rounded-lg px-4 py-3.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40"
      style={{
        background: selected
          ? 'linear-gradient(160deg, #15161f 0%, #0e0f16 100%)'
          : 'linear-gradient(160deg, #0e0f16 0%, #0a0b10 100%)',
        border: `1px solid ${selected ? 'rgba(201,168,76,0.45)' : '#1e2030'}`,
        boxShadow: selected
          ? '0 0 0 1px rgba(201,168,76,0.12), 0 0 28px rgba(201,168,76,0.10), inset 0 1px 0 rgba(201,168,76,0.12)'
          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {selected && <CornerBrackets color="rgba(201,168,76,0.7)" size={12} />}
      {selected && (
        <span
          aria-hidden
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)' }}
        />
      )}

      {/* Row 1: id · priority · gauge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${running > 0 ? 'hud-pulse-gold' : ''}`}
            style={{ background: pc, boxShadow: `0 0 6px ${pc}99` }}
          />
          <span className="font-tactical text-[10px] tracking-[0.16em] text-[#6b6e7a]">
            {id}
          </span>
          <span className="font-tactical text-[10px] tracking-[0.12em]" style={{ color: pc }}>
            {project.priority}
          </span>
          <span className="font-tactical text-[9px] tracking-[0.12em] text-[#4a4d5a] hidden sm:inline">
            {PRIORITY_TAG[project.priority]}
          </span>
        </div>
        <MiniGauge done={doneSteps} total={totalSteps} size={34} />
      </div>

      {/* Row 2: name */}
      <div
        className={`mt-2 font-semibold text-[15px] leading-tight truncate transition-colors ${selected ? 'text-[#e8e4da]' : 'text-[#c8c4bc] group-hover:text-[#e8e4da]'}`}
        title={project.name}
      >
        {project.name}
      </div>

      {/* Row 3: segment bar */}
      <div className="mt-3">
        <SegmentBar done={doneSteps} total={totalSteps} height={3} />
      </div>

      {/* Row 4: readouts + status dots */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="font-tactical text-[10px] tracking-[0.12em] text-[#4a4d5a] flex items-center gap-2">
          <span><span className="text-[#b8b4ac]">{doneSteps}</span>/{totalSteps} STEPS</span>
          <span className="text-[#1e2030]">·</span>
          <span><span className="text-[#b8b4ac]">{active}</span> ACTIVE</span>
        </div>
        <div className="flex items-center gap-1">
          {project.missions.slice(0, 8).map((m) => (
            <span
              key={m.id}
              title={`${m.name} — ${m.status}`}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: STATUS_DOT[m.status] ?? '#4a4d5a' }}
            />
          ))}
          {project.missions.length > 8 && (
            <span className="font-tactical text-[9px] text-[#4a4d5a]">+{project.missions.length - 8}</span>
          )}
        </div>
      </div>
    </button>
  );
}
