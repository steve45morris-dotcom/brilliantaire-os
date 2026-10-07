'use client';

import { CornerBrackets } from '../dashboard/hud';

export interface ProjectOption {
  id: string;
  name: string;
}

/** A proposed mission while the user reviews it. Steps are edited as one per line. */
export interface Draft {
  key: string;
  include: boolean;
  name: string;
  stepsText: string;
  projectId: string;
  estimate: string;
}

const FIELD =
  'bg-[#08090e] border border-[#1e2030] rounded-md text-[#d0ccc4] placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors disabled:opacity-50';

export function ProposalCard({
  draft,
  index,
  projects,
  onChange,
}: {
  draft: Draft;
  index: number;
  projects: ProjectOption[];
  onChange: (next: Draft) => void;
}) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const needsProject = draft.include && !draft.projectId;
  const stepCount = draft.stepsText.split('\n').map((s) => s.trim()).filter(Boolean).length;
  const id = `D-${String(index + 1).padStart(2, '0')}`;

  return (
    <div
      className="relative rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: draft.include ? 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)' : '#0a0b10',
        border: `1px solid ${needsProject ? 'rgba(245,158,11,0.4)' : draft.include ? 'rgba(201,168,76,0.25)' : '#1e2030'}`,
        boxShadow: draft.include ? 'inset 0 1px 0 rgba(201,168,76,0.08), 0 8px 24px rgba(0,0,0,0.25)' : 'none',
        opacity: draft.include ? 1 : 0.55,
      }}
    >
      {draft.include && <CornerBrackets color={needsProject ? 'rgba(245,158,11,0.6)' : 'rgba(201,168,76,0.5)'} size={12} />}

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2.5">
        <input
          type="checkbox"
          className="tac-check"
          aria-label={`Keep mission ${index + 1}`}
          checked={draft.include}
          onChange={(e) => set({ include: e.target.checked })}
        />
        <span className="font-tactical text-[10px] tracking-[0.16em] text-[#6b6e7a] shrink-0">{id}</span>
        <input
          aria-label={`Mission ${index + 1} name`}
          value={draft.name}
          maxLength={255}
          disabled={!draft.include}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Mission name"
          className={`flex-1 min-w-0 px-3 py-1.5 min-h-[38px] text-[15px] font-semibold ${FIELD}`}
        />
        {draft.include && (
          <span className="font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a] shrink-0 hidden sm:inline">
            {stepCount > 0 ? `${String(stepCount).padStart(2, '0')} STEPS` : 'NO STEPS'}
          </span>
        )}
      </div>

      {draft.include && (
        <div className="flex flex-col gap-3 px-4 pb-4 pl-[3.25rem] border-t border-[#1e2030]/70 pt-3">
          <textarea
            aria-label={`Mission ${index + 1} steps, one per line`}
            placeholder="Steps, one per line (optional)"
            rows={Math.min(6, Math.max(2, draft.stepsText.split('\n').length))}
            value={draft.stepsText}
            onChange={(e) => set({ stepsText: e.target.value })}
            className={`px-3 py-2 text-[13.5px] leading-relaxed ${FIELD}`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col gap-1">
              <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">PROJECT</span>
              <select
                aria-label={`Mission ${index + 1} project`}
                value={draft.projectId}
                onChange={(e) => set({ projectId: e.target.value })}
                className={`px-3 py-1.5 min-h-[36px] text-[13px] ${FIELD} ${needsProject ? '!border-amber-500/60 !text-amber-200' : ''}`}
              >
                <option value="">Choose a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">ESTIMATE</span>
              <label className="flex items-center gap-2 font-tactical text-[11px] tracking-[0.1em] text-[#4a4d5a]">
                <input
                  aria-label={`Mission ${index + 1} estimate in minutes`}
                  type="number"
                  min={1}
                  max={1440}
                  placeholder="—"
                  value={draft.estimate}
                  onChange={(e) => set({ estimate: e.target.value })}
                  className={`w-20 px-2 py-1.5 min-h-[36px] text-[13px] font-tactical tabular-nums ${FIELD}`}
                />
                MIN
              </label>
            </div>
            {needsProject && (
              <span className="font-tactical text-[9px] tracking-[0.14em] text-amber-300 self-end pb-2.5">PROJECT REQUIRED</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
