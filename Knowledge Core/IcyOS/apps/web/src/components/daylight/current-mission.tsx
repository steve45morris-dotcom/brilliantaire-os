'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Play } from 'lucide-react';
import type { MissionStatus } from '@icyos/shared';
import type { MissionCardActions } from '../dashboard/mission-card';
import { formatMinutes } from '../dashboard/mission-card';
import { PRIORITY_LABELS } from '../dashboard/forms';
import { ACTIVE_STATUSES } from '../../lib/workspace/daylight';
import type { MissionView, ProjectView, StepView } from '../../lib/workspace/overview';
import { useDismiss } from './daylight-nav';
import { tiltHandlers } from './daylight-fx';
import { InlineEdit } from './inline-edit';
import s from './daylight.module.css';

const STEP_PREVIEW = 12;
const STEP_LIMIT = 50;

export const PILL_CLASS: Record<MissionStatus, string> = {
  Staged: s.sStaged,
  Approved: s.sApproved,
  Running: s.sRunning,
  Completed: s.sCompleted,
  Failed: s.sFailed,
  Skipped: s.sSkipped,
};

const pad = (n: number) => String(n).padStart(2, '0');

function StepRow({ mission, step, index, pending, actions }: { mission: MissionView; step: StepView; index: number; pending: boolean; actions: MissionCardActions }) {
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useDismiss(menu, () => setMenu(false));
  const done = Boolean(step.completedAt);
  return (
    <li className={`${s.step} ${done ? s.stepDone : ''}`}>
      <input
        type="checkbox"
        className={s.box}
        aria-label={step.command}
        checked={done}
        disabled={pending}
        data-snd="high"
        onChange={(e) => actions.toggleStep(mission, step.id, e.target.checked)}
      />
      <InlineEdit value={step.command} label={`step ${step.command}`} maxLength={512} editing={editing} onDone={() => setEditing(false)} onSave={(text) => actions.renameStep(step.id, text)}>
        <span className={s.stepText}>{step.command}</span>
      </InlineEdit>
      <span className={s.idx} aria-hidden>
        {pad(index + 1)}
      </span>
      {!editing && (
        <>
          {/* Pointer screens: labelled buttons on hover. Touch screens: one menu, so long steps keep their width. */}
          <span className={s.stepActs}>
            <button type="button" className={s.mini} aria-label={`Rename step ${step.command}`} onClick={() => setEditing(true)}>
              Rename
            </button>
            <button type="button" className={`${s.mini} ${s.miniDel}`} data-snd="low" aria-label={`Delete step ${step.command}`} onClick={() => void actions.deleteStep(step)}>
              Delete
            </button>
          </span>
          <div ref={menuRef} className={`${s.moreWrap} ${s.stepMore}`}>
            <button type="button" className={s.mini} aria-label={`Actions for step ${step.command}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              ⋯
            </button>
            {menu && (
              <div role="menu" className={`${s.menu} ${s.menuRight}`}>
                <button type="button" role="menuitem" className={s.menuItem} onClick={() => { setMenu(false); setEditing(true); }}>
                  Rename step
                </button>
                <button type="button" role="menuitem" data-snd="low" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { setMenu(false); void actions.deleteStep(step); }}>
                  Delete step
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </li>
  );
}

function AddStep({ onAdd }: { onAdd: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await onAdd(text.trim());
    setBusy(false);
    if (ok) setText('');
  }
  return (
    <form className={s.addStep} onSubmit={submit}>
      <span className={s.addBox} aria-hidden />
      <input
        className={s.addInput}
        aria-label="Add a step"
        placeholder={`Add a step · up to ${STEP_LIMIT}`}
        maxLength={512}
        value={text}
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
      />
      <span className={s.idx} aria-hidden>
        ↵
      </span>
    </form>
  );
}

interface CurrentMissionProps {
  mission: MissionView | null;
  project: ProjectView | null;
  projectIndex: number;
  pendingSteps: Set<string>;
  actions: MissionCardActions;
  onNewMission: () => void;
  /** True when the user opened this mission from Up next rather than it being the featured one. */
  opened?: boolean;
}

export function CurrentMission({ mission, project, projectIndex, pendingSteps, actions, onNewMission, opened = false }: CurrentMissionProps) {
  const [renaming, setRenaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useDismiss(menu, () => setMenu(false));

  if (!project) return null;

  if (!mission) {
    return (
      <section className={`${s.card} ${s.empty}`} aria-label="Current mission">
        <div className={s.lab}>Current mission</div>
        <h2 className={s.h2}>Nothing active in {project.name}</h2>
        <p>Every mission here is completed, failed or skipped. Add a new one, or pick another project below.</p>
        <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onNewMission}>
          Add a mission
        </button>
      </section>
    );
  }

  const missionIndex = project.missions.findIndex((m) => m.id === mission.id);
  const total = mission.steps.length;
  const collapsible = total > STEP_PREVIEW;
  const visible = collapsible && !expanded ? mission.steps.slice(0, STEP_PREVIEW) : mission.steps;
  const pct = total ? Math.round((mission.stepsDone / total) * 100) : 0;

  return (
    <section
      className={`${s.card} ${s.mission} ${s.tilt} ${s.float}`}
      aria-label="Current mission"
      {...tiltHandlers}
    >
      <div className={s.lab}>
        {opened ? 'Mission' : 'Current mission'}
        <span className={`${s.pill} ${PILL_CLASS[mission.status]}`}>
          {mission.status === 'Running' && <span className={s.liveDot} aria-hidden />}
          {mission.status}
        </span>
        {mission.sprintName && <span className={`${s.pill} ${s.pillPlain}`}>{mission.sprintName}</span>}
        {mission.estimatedMinutes != null && (
          <span className={s.id}>
            <Clock size={12} aria-hidden style={{ verticalAlign: -1 }} /> {formatMinutes(mission.estimatedMinutes)}
          </span>
        )}
        <span className={s.id}>
          PRJ-{pad(projectIndex + 1)} / M-{pad(missionIndex + 1)}
        </span>
        <div ref={menuRef} className={s.moreWrap} style={{ marginLeft: 'auto' }}>
          <button type="button" className={s.moreBtn} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            More ⋯
          </button>
          {menu && (
            <div role="menu" className={`${s.menu} ${s.menuRight}`}>
              <button type="button" role="menuitem" className={s.menuItem} onClick={() => { setMenu(false); setRenaming(true); }}>
                Rename mission
              </button>
              <button type="button" role="menuitem" data-snd="low" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { setMenu(false); actions.deleteMission(mission); }}>
                Delete mission…
              </button>
            </div>
          )}
        </div>
      </div>

      <h2 className={s.h2}>
        <InlineEdit value={mission.name} label={`mission ${mission.name}`} editing={renaming} onDone={() => setRenaming(false)} onSave={(name) => actions.renameMission(mission.id, name)}>
          {mission.name}
        </InlineEdit>
      </h2>
      <p className={s.ctx}>
        in <b>{project.name}</b> · {PRIORITY_LABELS[project.priority]}
      </p>

      <ul className={s.steps}>
        {visible.map((step, i) => (
          <StepRow key={step.id} mission={mission} step={step} index={i} pending={pendingSteps.has(step.id)} actions={actions} />
        ))}
        {collapsible && (
          <li>
            <button type="button" className={s.collapse} aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Collapse steps' : `Show all ${total} steps · ${total - visible.length} hidden`}
            </button>
          </li>
        )}
        {total < STEP_LIMIT && (
          <li>
            <AddStep onAdd={(text) => actions.addStep(mission.id, text)} />
          </li>
        )}
      </ul>

      <div className={s.mfoot}>
        <div className={s.prog}>
          <span className={s.bar} role="progressbar" aria-label="Steps done" aria-valuemin={0} aria-valuemax={total} aria-valuenow={mission.stepsDone}>
            <i className={`${s.fill} ${mission.status === 'Completed' ? s.fillDone : ''}`} style={{ width: `${pct}%` }} />
          </span>
          <span>
            <b>{mission.stepsDone}</b> of {total} steps
          </span>
        </div>
        <div className={s.btnRow}>
          <button type="button" className={s.btn} onClick={() => setRenaming(true)}>
            Rename
          </button>
          {/* Focus only accepts staged, approved or running missions; any other id falls back to a different mission. */}
          {ACTIVE_STATUSES.has(mission.status) && (
            <Link href={`/focus?mission=${mission.id}`} className={`${s.btn} ${s.btnOx}`} data-snd="drum">
              <Play size={14} aria-hidden /> Start focus
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
