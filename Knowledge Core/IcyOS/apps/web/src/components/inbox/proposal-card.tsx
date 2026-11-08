'use client';

import { tiltHandlers } from '../daylight/daylight-fx';
import s from '../daylight/daylight.module.css';

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
  const stepCount = draft.stepsText.split('\n').map((s) => s.trim()).filter(Boolean).length;
  const id = `D-${String(index + 1).padStart(2, '0')}`;

  return (
    <div
      className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.rise} ${draft.include ? '' : s.draftOff} ${needsProject ? s.draftWarn : ''}`}
      // Cards are dealt in one after another.
      style={{ animationDelay: `${Math.min(index, 8) * 0.08}s` }}
      {...tiltHandlers}
    >
      <div className={s.form}>
        <input
          type="checkbox"
          className={s.box}
          data-snd={draft.include ? 'low' : 'high'}
          aria-label={`Keep mission ${index + 1}`}
          checked={draft.include}
          onChange={(e) => set({ include: e.target.checked })}
        />
        <span className={s.meta}>{id}</span>
        <input
          aria-label={`Mission ${index + 1} name`}
          value={draft.name}
          maxLength={255}
          disabled={!draft.include}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Mission name"
          className={s.field}
          style={{ fontWeight: 700 }}
        />
        {draft.include && (
          <span className={`${s.pill} ${s.pillPlain}`}>{stepCount > 0 ? `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}` : 'No steps'}</span>
        )}
      </div>

      {draft.include && (
        <div className={`${s.form} ${s.formCol}`} style={{ marginTop: 12 }}>
          <textarea
            aria-label={`Mission ${index + 1} steps, one per line`}
            placeholder="Steps, one per line (optional)"
            rows={Math.min(6, Math.max(2, draft.stepsText.split('\n').length))}
            value={draft.stepsText}
            onChange={(e) => set({ stepsText: e.target.value })}
            className={s.area}
            style={{ minHeight: 0 }}
          />
          <div className={s.form} style={{ alignItems: 'end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className={s.lab}>Project</span>
              <select
                aria-label={`Mission ${index + 1} project`}
                value={draft.projectId}
                onChange={(e) => set({ projectId: e.target.value })}
                className={s.selectField}
                style={needsProject ? { borderColor: 'var(--terra)' } : undefined}
              >
                <option value="">Choose a project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className={s.lab}>Estimate (min)</span>
              <input
                aria-label={`Mission ${index + 1} estimate in minutes`}
                type="number"
                min={1}
                max={1440}
                placeholder="—"
                value={draft.estimate}
                onChange={(e) => set({ estimate: e.target.value })}
                className={s.selectField}
                style={{ width: 110 }}
              />
            </label>
            {needsProject && (
              <span className={s.formError} style={{ width: 'auto', paddingBottom: 10 }}>
                Project required
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
