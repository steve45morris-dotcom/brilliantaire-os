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

const STATUS_COLOR: Record<string, string> = {
  Running: '#c9a84c',
  Approved: '#22d3ee',
  Staged: '#4a4d5a',
  Completed: '#34d399',
  Skipped: '#2a2d3a',
  Failed: '#ef4444',
};

const PREVIEW = 3;

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
  const done = project.missions.length - active;
  const pc = PRIORITY_COLOR[project.priority];
  const id = `PRJ-${String(index + 1).padStart(2, '0')}`;
  const preview = [...project.missions]
    .sort((a, b) => (a.status === 'Running' ? -1 : b.status === 'Running' ? 1 : 0))
    .slice(0, PREVIEW);
  const overflow = project.missions.length - preview.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Select project ${project.name}`}
      className="group relative w-full text-left rounded-lg px-4 pt-3.5 pb-4 flex flex-col transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]/40 hover:-translate-y-px"
      style={{
        background: selected
          ? 'linear-gradient(160deg, #16171f 0%, #0e0f16 100%)'
          : 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)',
        border: `1px solid ${selected ? 'rgba(201,168,76,0.5)' : '#1e2030'}`,
        boxShadow: selected
          ? '0 0 0 1px rgba(201,168,76,0.14), 0 0 34px rgba(201,168,76,0.12), 0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(201,168,76,0.14)'
          : '0 8px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {!selected && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.22), 0 0 22px rgba(201,168,76,0.06)' }}
        />
      )}
      {selected && <CornerBrackets color="rgba(201,168,76,0.75)" size={12} />}
      {selected && (
        <span
          aria-hidden
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.85), transparent)' }}
        />
      )}
      {/* Priority rail */}
      <span aria-hidden className="absolute left-0 top-5 bottom-5 w-px" style={{ background: `linear-gradient(180deg, transparent, ${pc}bb, transparent)` }} />

      {/* Row 1: id · priority · gauge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 font-tactical">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${running > 0 ? 'hud-pulse-gold' : ''}`}
            style={{ background: pc, boxShadow: `0 0 6px ${pc}99` }}
          />
          <span className="text-[10px] tracking-[0.16em] text-[#6b6e7a]">{id}</span>
          <span className="text-[10px] tracking-[0.12em]" style={{ color: pc }}>{project.priority}</span>
          <span className="text-[9px] tracking-[0.12em] text-[#4a4d5a] hidden sm:inline">{PRIORITY_TAG[project.priority]}</span>
        </div>
        <MiniGauge done={doneSteps} total={totalSteps} size={38} />
      </div>

      {/* Row 2: name */}
      <div
        className={`mt-2 font-semibold text-[17px] leading-tight truncate transition-colors ${selected ? 'text-[#ece8de]' : 'text-[#cfcbc3] group-hover:text-[#ece8de]'}`}
        title={project.name}
      >
        {project.name}
      </div>

      {/* Row 3: readouts */}
      <div className="mt-3 grid grid-cols-3 gap-2 font-tactical">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">STEPS</span>
          <span className="text-[15px] leading-none font-semibold tabular-nums text-[#e0dcd2]">
            {doneSteps}<span className="text-[#4a4d5a]">/{totalSteps}</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">ACTIVE</span>
          <span className="text-[15px] leading-none font-semibold tabular-nums" style={{ color: active > 0 ? '#c9a84c' : '#4a4d5a' }}>
            {String(active).padStart(2, '0')}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">DONE</span>
          <span className="text-[15px] leading-none font-semibold tabular-nums" style={{ color: done > 0 ? '#34d399' : '#4a4d5a' }}>
            {String(done).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Row 4: segment bar */}
      <div className="mt-3">
        <SegmentBar done={doneSteps} total={totalSteps} height={3} />
      </div>

      {/* Row 5: mission preview */}
      <div className="mt-3 pt-3 border-t border-[#1e2030] flex flex-col gap-1.5">
        {preview.length === 0 && (
          <span className="font-tactical text-[9px] tracking-[0.16em] text-[#2f3240]">NO MISSIONS</span>
        )}
        {preview.map((m) => {
          const c = STATUS_COLOR[m.status] ?? '#4a4d5a';
          const closed = ['Completed', 'Skipped', 'Failed'].includes(m.status);
          return (
            <div key={m.id} className="flex items-center gap-2 min-w-0">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === 'Running' ? 'hud-pulse-gold' : ''}`}
                style={{ background: c, boxShadow: m.status === 'Running' ? `0 0 6px ${c}` : 'none' }}
              />
              <span className={`flex-1 min-w-0 truncate text-[12px] ${closed ? 'text-[#4a4d5a] line-through decoration-[#2a2d3a]' : 'text-[#b8b4ac]'}`} title={m.name}>
                {m.name}
              </span>
              <span className="font-tactical text-[9px] tabular-nums shrink-0" style={{ color: closed ? '#2f3240' : '#6b6e7a' }}>
                {m.steps.length > 0 ? `${m.stepsDone}/${m.steps.length}` : '—'}
              </span>
            </div>
          );
        })}
        {overflow > 0 && (
          <span className="font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a]">+{overflow} MORE</span>
        )}
      </div>
    </button>
  );
}
