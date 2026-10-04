'use client';

import { Card } from '../ui/card';

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

  return (
    <Card className={`flex flex-col gap-3 transition-opacity ${draft.include ? '' : 'opacity-50'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-2.5 shrink-0"
          aria-label={`Keep mission ${index + 1}`}
          checked={draft.include}
          onChange={(e) => set({ include: e.target.checked })}
        />
        <input
          aria-label={`Mission ${index + 1} name`}
          value={draft.name}
          maxLength={255}
          disabled={!draft.include}
          onChange={(e) => set({ name: e.target.value })}
          className="flex-1 min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm font-semibold text-zinc-100 focus:outline-none focus:border-pink-500"
        />
      </div>

      {draft.include && (
        <div className="flex flex-col gap-3 pl-7">
          <textarea
            aria-label={`Mission ${index + 1} steps, one per line`}
            placeholder="Steps, one per line (optional)"
            rows={Math.min(6, Math.max(2, draft.stepsText.split('\n').length))}
            value={draft.stepsText}
            onChange={(e) => set({ stepsText: e.target.value })}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-pink-500"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label={`Mission ${index + 1} project`}
              value={draft.projectId}
              onChange={(e) => set({ projectId: e.target.value })}
              className={`px-3 py-1.5 bg-zinc-950 border rounded-md text-sm focus:outline-none focus:border-pink-500 ${
                needsProject ? 'border-amber-500/60 text-amber-200' : 'border-zinc-800 text-zinc-200'
              }`}
            >
              <option value="">Choose a project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                aria-label={`Mission ${index + 1} estimate in minutes`}
                type="number"
                min={1}
                max={1440}
                placeholder="—"
                value={draft.estimate}
                onChange={(e) => set({ estimate: e.target.value })}
                className="w-20 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:border-pink-500"
              />
              min
            </label>
          </div>
        </div>
      )}
    </Card>
  );
}
