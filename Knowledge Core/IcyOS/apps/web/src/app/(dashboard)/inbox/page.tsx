'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';
import { ProposalCard, type Draft, type ProjectOption } from '../../../components/inbox/proposal-card';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { apiFetch } from '../../../lib/api/client';
import { MAX_DUMP_CHARS, type SortResult } from '../../../lib/inbox/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Steps as typed, one per non-blank line. */
const stepsOf = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);

/** A whole number of minutes from 1 to 1440, null when blank, NaN when invalid. */
function minutesOf(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= 1440 ? n : NaN;
}

export default function InboxPage() {
  const [projects, setProjects] = useState<ProjectOption[] | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(true);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [source, setSource] = useState<SortResult['source'] | null>(null);
  const [busy, setBusy] = useState<'sort' | 'add' | 'project' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [newProject, setNewProject] = useState('');

  const loadProjects = useCallback(async () => {
    const res = await apiFetch<WorkspaceOverview>('/api/workspace');
    if (res.success && res.data) {
      setHasWorkspace(Boolean(res.data.workspace));
      setProjects(res.data.projects.map((p) => ({ id: p.id, name: p.name })));
      return res.data.projects;
    }
    setError(res.error?.message ?? 'Could not load your projects');
    return null;
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  async function sort(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy('sort');
    setError(null);
    setAdded(null);
    const res = await apiFetch<SortResult>('/api/inbox/sort', { method: 'POST', body: JSON.stringify({ text }) });
    setBusy(null);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not sort that');
      return;
    }
    setSource(res.data.source);
    setDrafts(
      res.data.missions.map((m, i) => ({
        key: `${Date.now()}-${i}`,
        include: true,
        name: m.name,
        stepsText: m.steps.join('\n'),
        projectId: m.projectId ?? '',
        estimate: m.estimatedMinutes ? String(m.estimatedMinutes) : '',
      }))
    );
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const name = newProject.trim();
    if (!name || busy) return;
    setBusy('project');
    setError(null);
    const res = await apiFetch<{ project_id: string }>('/api/projects', { method: 'POST', body: JSON.stringify({ name }) });
    setBusy(null);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not create the project');
      return;
    }
    const id = res.data.project_id;
    setNewProject('');
    await loadProjects();
    // Missions still waiting for a project go into the new one.
    setDrafts((ds) => ds?.map((d) => (d.include && !d.projectId ? { ...d, projectId: id } : d)) ?? ds);
  }

  const kept = drafts?.filter((d) => d.include) ?? [];
  const missingProject = kept.filter((d) => !d.projectId).length;
  const badName = kept.some((d) => !d.name.trim());
  const badEstimate = kept.some((d) => Number.isNaN(minutesOf(d.estimate)));
  const canAdd = kept.length > 0 && !missingProject && !badName && !badEstimate && busy === null;

  async function add() {
    if (!canAdd) return;
    setBusy('add');
    setError(null);
    const missions = kept.map((d) => ({
      projectId: d.projectId,
      name: d.name.trim(),
      steps: stepsOf(d.stepsText),
      estimatedMinutes: minutesOf(d.estimate),
    }));
    const res = await apiFetch('/api/inbox/add', { method: 'POST', body: JSON.stringify({ missions }) });
    setBusy(null);
    if (!res.success) {
      setError(res.error?.message ?? 'Could not add those missions');
      return;
    }
    setAdded(missions.length);
    setDrafts(null);
    setSource(null);
    setText('');
  }

  const fill = Math.min(1, text.length / MAX_DUMP_CHARS);

  if (!hasWorkspace) {
    return (
      <DaylightFrame>
        <section className={s.hero}>
          <h1 className={s.h1}>Inbox</h1>
          <p className={s.sub}>IcyOS needs a workspace before it can sort anything.</p>
          <a href="/onboarding" className={`${s.btn} ${s.btnDark}`} style={{ marginTop: 20 }}>
            Start setup
          </a>
        </section>
      </DaylightFrame>
    );
  }

  return (
    <DaylightFrame>
      <section className={s.hero}>
        <p className={s.meta}>{projects ? plural(projects.length, 'project') : 'Loading projects…'}</p>
        <h1 className={s.h1}>
          Inbox
          <span className={s.h1em}>Empty your head.</span>
        </h1>
        <p className={s.sub}>IcyOS turns it into missions you review before anything is saved.</p>
      </section>

      <div className={s.page}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad}`}>
            {error}
          </p>
        )}

        {added !== null && (
          <div className={`${s.notice} ${s.noticeGood}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} aria-hidden /> {plural(added, 'mission')} added
            </span>
            <a href="/dashboard" style={{ textDecoration: 'underline' }}>
              View on dashboard →
            </a>
          </div>
        )}

        {/* ── Dump state ── */}
        {!drafts && (
          <form onSubmit={sort} className={`${s.card} ${s.panel}`}>
            <div className={s.sec} style={{ marginTop: 0 }}>
              <span className={s.lab}>Brain dump</span>
              <span className={s.meta}>{plural(text ? text.split('\n').length : 0, 'line')}</span>
            </div>
            <textarea
              aria-label="Brain dump"
              autoFocus
              rows={10}
              maxLength={MAX_DUMP_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'Everything on your mind, as messy as you like:\n- email the printer about posters (30 min)\n- podcast: book a guest, write questions\n- gym 1h, call mum…'}
              className={s.area}
              style={{ width: '100%', resize: 'vertical', lineHeight: 1.6 }}
            />
            <div className={s.form} style={{ marginTop: 14 }}>
              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className={s.g} style={{ display: 'block', flex: 'none' }} aria-hidden>
                  <span className={s.fill} style={{ width: `${fill * 100}%`, background: fill > 0.9 ? 'var(--bad)' : undefined }} />
                </span>
                <span className={s.meta}>
                  {text.length.toLocaleString()} / {MAX_DUMP_CHARS.toLocaleString()} characters
                </span>
              </div>
              <button type="submit" className={`${s.btn} ${s.btnOx}`} disabled={!text.trim() || busy !== null}>
                <Sparkles size={15} aria-hidden /> {busy === 'sort' ? 'Sorting…' : 'Sort it'}
              </button>
            </div>
          </form>
        )}

        {/* ── Review state ── */}
        {drafts && (
          <>
            <div className={s.sec}>
              <div>
                <span className={s.lab}>Proposed missions</span>
                <p className={s.ctx} style={{ marginTop: 4 }}>
                  {drafts.length ? (
                    <>
                      {plural(drafts.length, 'mission')} found · {kept.length} selected
                      {source && <> · sorted by {source === 'claude' ? 'Claude' : 'simple rules'}</>}
                    </>
                  ) : (
                    'Nothing actionable found.'
                  )}
                </p>
              </div>
              <button
                type="button"
                className={s.btn}
                onClick={() => {
                  setDrafts(null);
                  setSource(null);
                }}
              >
                <ArrowLeft size={15} aria-hidden /> Back to text
              </button>
            </div>
            {source === 'rules' && drafts.length > 0 && (
              <p className={s.nothing}>Sorted by simple rules — no AI key set — so check the names.</p>
            )}

            {drafts.map((d, i) => (
              <ProposalCard
                key={d.key}
                draft={d}
                index={i}
                projects={projects ?? []}
                onChange={(next) => setDrafts((ds) => ds?.map((x) => (x.key === d.key ? next : x)) ?? ds)}
              />
            ))}

            {missingProject > 0 && (
              <form onSubmit={createProject} className={`${s.notice} ${s.noticeWarn}`}>
                <span>
                  {missingProject === 1 ? '1 mission needs' : `${missingProject} missions need`} a project. Pick one above, or create one:
                </span>
                <div className={s.form} style={{ flex: 1, minWidth: '16rem' }}>
                  <input
                    aria-label="New project name"
                    placeholder="New project name"
                    maxLength={255}
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className={s.field}
                  />
                  <button type="submit" className={s.btn} disabled={!newProject.trim() || busy !== null}>
                    <Plus size={15} aria-hidden /> {busy === 'project' ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            )}

            {drafts.length > 0 && (
              <div className={s.form} style={{ justifyContent: 'flex-end' }}>
                {badEstimate && <span className={s.formError} style={{ width: 'auto' }}>Estimates are whole minutes, 1–1440.</span>}
                {badName && <span className={s.formError} style={{ width: 'auto' }}>Every mission needs a name.</span>}
                <button type="button" className={`${s.btn} ${s.btnDark}`} disabled={!canAdd} onClick={add}>
                  <Plus size={15} aria-hidden /> {busy === 'add' ? 'Adding…' : `Add ${plural(kept.length, 'mission')}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DaylightFrame>
  );
}
