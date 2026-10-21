'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { MissionStatus, Priority } from '@icyos/shared';
import { PRIORITY_LABELS, parseSteps } from '../dashboard/forms';
import type { ProjectActions } from '../dashboard/project-section';
import { statusCounts } from '../../lib/workspace/daylight';
import type { ProjectView } from '../../lib/workspace/overview';
import { useDismiss } from './daylight-nav';
import { InlineEdit } from './inline-edit';
import s from './daylight.module.css';

const PRIO_CLASS: Record<Priority, string> = { P1: s.p1, P2: s.p2, P3: s.p3 };
const ORDER: readonly MissionStatus[] = ['Running', 'Approved', 'Staged', 'Completed', 'Failed', 'Skipped'];

function summary(project: ProjectView): string {
  if (project.missions.length === 0) return 'No missions yet';
  const counts = statusCounts([project]);
  const parts = ORDER.filter((st) => counts[st] > 0).map((st) => `${counts[st]} ${st.toLowerCase()}`);
  return project.missions.length === 1 ? `${parts[0]} · ${project.missions[0].name}` : parts.join(' · ');
}

export function NewProjectForm({ onCreate, onCancel }: { onCreate: (name: string, priority: Priority) => Promise<boolean>; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>('P2');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const ok = await onCreate(name.trim(), priority);
    setBusy(false);
    if (ok) onCancel();
  }
  return (
    <div className={`${s.card} ${s.formCard}`}>
      <form className={s.form} onSubmit={submit}>
        <input autoFocus className={s.field} aria-label="New project name" placeholder="Project name" maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
        <select className={s.selectField} aria-label="New project priority" value={priority} disabled={busy} onChange={(e) => setPriority(e.target.value as Priority)}>
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <button type="button" className={s.btn} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className={`${s.btn} ${s.btnDark}`} disabled={!name.trim() || busy} data-snd="drum">
          {busy ? 'Adding…' : 'Add project'}
        </button>
      </form>
    </div>
  );
}

export function NewMissionForm({ projectName, onCreate, onCancel }: { projectName: string; onCreate: (name: string, steps: string[]) => Promise<boolean>; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState('');
  const [busy, setBusy] = useState(false);
  const list = parseSteps(steps);
  const tooMany = list.length > 50;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || tooMany || busy) return;
    setBusy(true);
    const ok = await onCreate(name.trim(), list);
    setBusy(false);
    if (ok) onCancel();
  }
  return (
    <div className={`${s.card} ${s.formCard}`}>
      <form className={`${s.form} ${s.formCol}`} onSubmit={submit}>
        <div className={s.lab}>New mission in {projectName}</div>
        <input autoFocus className={s.field} aria-label={`New mission name in ${projectName}`} placeholder="Mission name" maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
        <textarea className={s.area} aria-label="Steps, one per line" placeholder={'Steps, one per line (optional)\nWrite the outline\nBook a guest'} rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} />
        {tooMany && <p className={s.formError}>A mission can have at most 50 steps.</p>}
        <div className={s.btnRow} style={{ justifyContent: 'flex-end' }}>
          <button type="button" className={s.btn} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`${s.btn} ${s.btnDark}`} disabled={!name.trim() || tooMany || busy} data-snd="drum">
            {busy ? 'Adding…' : 'Add mission'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProjectCard({ project, index, selected, onSelect, onAddMission, actions }: { project: ProjectView; index: number; selected: boolean; onSelect: () => void; onAddMission: () => void; actions: ProjectActions }) {
  const [renaming, setRenaming] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useDismiss(menu, () => setMenu(false));
  const total = project.missions.reduce((n, m) => n + m.steps.length, 0);
  const done = project.missions.reduce((n, m) => n + m.stepsDone, 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div className={`${s.card} ${s.pc} ${selected ? s.pcSel : ''}`} onClick={onSelect}>
      <div className={s.pt}>
        <span className={s.pid}>PRJ-{String(index + 1).padStart(2, '0')}</span>
        <select
          className={`${s.prio} ${PRIO_CLASS[project.priority]}`}
          aria-label={`Priority of ${project.name}`}
          value={project.priority}
          onClick={stop}
          onChange={(e) => void actions.setPriority(project.id, e.target.value as Priority)}
        >
          {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]} ▾
            </option>
          ))}
        </select>
      </div>
      <InlineEdit value={project.name} label={`project ${project.name}`} editing={renaming} onDone={() => setRenaming(false)} onSave={(name) => actions.renameProject(project.id, name)}>
        <button
          type="button"
          className={s.pname}
          aria-pressed={selected}
          aria-label={`${project.name}${selected ? ', current project' : '. Make its mission current'}`}
          onClick={(e) => {
            stop(e);
            onSelect();
          }}
          style={{ border: 0, background: 'transparent', padding: 0, textAlign: 'left' }}
        >
          {project.name}
        </button>
      </InlineEdit>
      <div className={s.pmeta}>{summary(project)}</div>
      <div className={s.pg}>
        <span className={s.g} role="progressbar" aria-label={`Steps done in ${project.name}`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <i className={`${s.fill} ${pct === 100 ? s.fillDone : s.fillWarm}`} style={{ width: `${pct}%` }} />
        </span>
        {done} / {total}
      </div>
      <div className={s.pa} onClick={stop}>
        <button type="button" onClick={onAddMission}>
          + Mission
        </button>
        <button type="button" onClick={() => setRenaming(true)}>
          Rename
        </button>
        <div ref={menuRef} className={s.moreWrap}>
          <button type="button" aria-label={`More actions for ${project.name}`} aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            ⋯
          </button>
          {menu && (
            <div role="menu" className={s.menu}>
              <button type="button" role="menuitem" data-snd="low" className={`${s.menuItem} ${s.menuDanger}`} onClick={() => { setMenu(false); actions.deleteProject(project); }}>
                Delete project…
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ProjectCardsProps {
  projects: readonly ProjectView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  adding: boolean;
  onAddProject: () => void;
  onCancelProject: () => void;
  onCreateProject: (name: string, priority: Priority) => Promise<boolean>;
  missionFor: string | null;
  onAddMission: (projectId: string | null) => void;
  actions: ProjectActions;
}

export function ProjectCards({ projects, selectedId, onSelect, adding, onAddProject, onCancelProject, onCreateProject, missionFor, onAddMission, actions }: ProjectCardsProps) {
  const missionProject = projects.find((p) => p.id === missionFor) ?? null;
  return (
    <section className={s.projects} aria-label="Your projects">
      <div className={s.sec}>
        <h3 className={s.h3}>
          Your <em>projects</em>
        </h3>
        <div className={s.secR}>
          {projects.length > 0 && 'Pick one to make its mission current'}
          {!adding && (
            <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onAddProject}>
              <Plus size={14} aria-hidden /> New project
            </button>
          )}
        </div>
      </div>
      {adding && <NewProjectForm onCreate={onCreateProject} onCancel={onCancelProject} />}
      {missionProject && (
        <NewMissionForm
          key={missionProject.id}
          projectName={missionProject.name}
          onCreate={(name, steps) => actions.createMission(missionProject.id, name, steps)}
          onCancel={() => onAddMission(null)}
        />
      )}
      {projects.length === 0 && !adding ? (
        <div className={`${s.card} ${s.empty}`}>
          <h2 className={s.h2}>No projects yet</h2>
          <p>Start with one project. Its first staged mission becomes your current mission.</p>
          <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onAddProject}>
            Create your first project
          </button>
        </div>
      ) : (
        <div className={s.prow} style={{ marginTop: adding || missionProject ? 16 : 0 }}>
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} onAddMission={() => onAddMission(p.id)} actions={actions} />
          ))}
        </div>
      )}
    </section>
  );
}
