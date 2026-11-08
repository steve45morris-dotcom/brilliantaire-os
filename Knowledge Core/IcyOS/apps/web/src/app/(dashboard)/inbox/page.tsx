'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowLeft, Plus, CheckCircle2, ArrowUp, Layers, List } from 'lucide-react';
import { ProposalCard, type Draft, type ProjectOption } from '../../../components/inbox/proposal-card';
import { SwipeDeck } from '../../../components/inbox/swipe-deck';
import { Words } from '../../../components/daylight/command-hero';
import { tiltHandlers } from '../../../components/daylight/daylight-fx';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { apiFetch } from '../../../lib/api/client';
import { assignUnassigned, formatMinutes, itemCount, minutesOf, plannedMinutes, stepsOf } from '../../../lib/inbox/review';
import { MAX_DUMP_CHARS, type SortResult } from '../../../lib/inbox/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The unsent brain dump, kept in this browser only so a refresh doesn't lose it.
const DRAFT_KEY = 'icyos:inbox-draft';
const isSubmitKey = (e: { key: string; metaKey: boolean; ctrlKey: boolean }) => e.key === 'Enter' && (e.metaKey || e.ctrlKey);

export default function InboxPage() {
  const [projects, setProjects] = useState<ProjectOption[] | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(true);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [source, setSource] = useState<SortResult['source'] | null>(null);
  const [busy, setBusy] = useState<'sort' | 'add' | 'project' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);
  const [newProject, setNewProject] = useState('');
  const [restored, setRestored] = useState(false);
  // Review one card at a time (swipe) or all at once (list). Decided keys leave the deck.
  const [mode, setMode] = useState<'deck' | 'list'>('deck');
  const [decided, setDecided] = useState<Set<string>>(new Set());
  const [capture, setCapture] = useState('');
  const loadedDraft = useRef(false);

  const loadProjects = useCallback(async () => {
    const res = await apiFetch<WorkspaceOverview>('/api/workspace');
    if (res.success && res.data) {
      setHasWorkspace(Boolean(res.data.workspace));
      setWorkspaceName(res.data.workspace?.name ?? null);
      setProjects(res.data.projects.map((p) => ({ id: p.id, name: p.name })));
      return res.data.projects;
    }
    setError(res.error?.message ?? 'Could not load your projects');
    return null;
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Restore the unsent dump once, then keep it saved as it changes. Storage can be
  // unavailable (private windows, blocked site data); the page works without it.
  useEffect(() => {
    if (!loadedDraft.current) {
      loadedDraft.current = true;
      try {
        const saved = window.localStorage.getItem(DRAFT_KEY);
        if (saved) {
          setText(saved.slice(0, MAX_DUMP_CHARS));
          setRestored(true);
        }
      } catch {}
      return;
    }
    try {
      if (text) window.localStorage.setItem(DRAFT_KEY, text);
      else window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, [text]);

  async function sort(e?: React.FormEvent) {
    e?.preventDefault();
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
    setDecided(new Set());
    setMode(res.data.missions.length > 1 ? 'deck' : 'list');
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
    setDrafts((ds) => (ds ? assignUnassigned(ds, id) : ds));
  }

  const kept = drafts?.filter((d) => d.include) ?? [];
  const missingProject = kept.filter((d) => !d.projectId).length;
  const badName = kept.some((d) => !d.name.trim());
  const badEstimate = kept.some((d) => Number.isNaN(minutesOf(d.estimate)));
  const canAdd = kept.length > 0 && !missingProject && !badName && !badEstimate && busy === null;
  const planned = plannedMinutes(kept.map((d) => d.estimate));

  async function add() {
    // Adding waits until the deck is done, so nothing undecided is saved by accident.
    if (!canAdd || (mode === 'deck' && drafts?.some((d) => !decided.has(d.key)))) return;
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
    setRestored(false);
  }

  // ⌘/Ctrl+Enter adds the kept missions while reviewing.
  const addRef = useRef(add);
  addRef.current = add;
  useEffect(() => {
    if (!drafts) return;
    const onKey = (e: KeyboardEvent) => {
      if (isSubmitKey(e)) {
        e.preventDefault();
        void addRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drafts]);

  const setAll = (include: boolean) => setDrafts((ds) => ds?.map((d) => ({ ...d, include })) ?? ds);
  const updateDraft = (next: Draft) => setDrafts((ds) => ds?.map((x) => (x.key === next.key ? next : x)) ?? ds);
  const queue = drafts?.filter((d) => !decided.has(d.key)) ?? [];
  const showDeck = mode === 'deck' && queue.length > 0;

  function decide(key: string, keep: boolean) {
    setDrafts((ds) => ds?.map((d) => (d.key === key ? { ...d, include: keep } : d)) ?? ds);
    setDecided((prev) => {
      const next = new Set(prev).add(key);
      // Every card decided: show the kept ones as a list to finish and add.
      if (drafts && next.size >= drafts.length) setMode('list');
      return next;
    });
  }

  // The orb dock adds one thought to the brain dump as a new line.
  function captureThought(e: React.FormEvent) {
    e.preventDefault();
    const thought = capture.trim();
    if (!thought) return;
    setText((t) => `${t}${t && !t.endsWith('\n') ? '\n' : ''}- ${thought}`.slice(0, MAX_DUMP_CHARS));
    setCapture('');
  }
  const fill = Math.min(1, text.length / MAX_DUMP_CHARS);
  const items = itemCount(text);

  if (!hasWorkspace) {
    return (
      <DaylightFrame>
        <section className={s.hero}>
          <span className={s.floor} aria-hidden />
          <h1 className={s.h1}>
            <Words text="Inbox" delay={0.05} />
          </h1>
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
      <section className={s.hero} aria-label="Inbox">
        <span className={s.floor} aria-hidden />
        <p className={s.meta}>
          <span className={s.liveDot} aria-hidden />
          {workspaceName ?? 'Inbox'} · {projects ? plural(projects.length, 'project') : 'loading projects…'}
        </p>
        <h1 className={s.h1}>
          <Words text="Inbox" delay={0.05} />
          <span className={s.h1em}>
            <Words text="Empty your head." delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>Write it messy. IcyOS turns it into missions you review before anything is saved.</p>
      </section>

      <div className={s.page}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad} ${s.rise}`}>
            {error}
          </p>
        )}

        {added !== null && (
          <div className={`${s.notice} ${s.noticeGood} ${s.rise}`} role="status">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} aria-hidden /> {plural(added, 'mission')} added to your workspace
            </span>
            <a href="/dashboard" style={{ textDecoration: 'underline' }}>
              View on dashboard →
            </a>
          </div>
        )}

        {/* ── Dump state ── */}
        {!drafts && (
          <form onSubmit={sort} className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft} ${s.rise}`} style={{ animationDelay: '0.35s' }} {...tiltHandlers}>
            <div className={s.sec} style={{ marginTop: 0 }}>
              <span className={s.lab}>Brain dump</span>
              <span className={s.meta}>
                {restored && text ? 'Draft restored · ' : text ? 'Draft saved · ' : ''}
                {items ? `about ${plural(items, 'item')}` : plural(0, 'item')}
              </span>
            </div>
            <textarea
              aria-label="Brain dump"
              autoFocus
              rows={10}
              maxLength={MAX_DUMP_CHARS}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (isSubmitKey(e)) {
                  e.preventDefault();
                  void sort();
                }
              }}
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
              <kbd className={s.kbd} style={{ marginLeft: 0 }}>
                ⌘ Enter
              </kbd>
              <button type="submit" className={`${s.btn} ${s.btnOx}`} disabled={!text.trim() || busy !== null} data-snd="drum">
                <Sparkles size={15} aria-hidden /> {busy === 'sort' ? 'Sorting…' : 'Sort it'}
              </button>
            </div>
          </form>
        )}

        {!drafts && (
          <form onSubmit={captureThought} className={`${s.card} ${s.dock}`} aria-label="Capture a thought">
            <span className={`${s.orb} ${busy === 'sort' ? s.orbLive : ''}`} aria-hidden />
            <input
              aria-label="Add a thought to the brain dump"
              placeholder="Capture a thought and press Enter…"
              maxLength={500}
              value={capture}
              onChange={(e) => setCapture(e.target.value)}
              className={s.dockInput}
            />
            <button type="submit" className={`${s.go}`} aria-label="Add to brain dump" disabled={!capture.trim()} data-snd="high" style={{ border: 0 }}>
              <ArrowUp size={18} aria-hidden />
            </button>
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
                      {planned > 0 && <> · {formatMinutes(planned)} planned</>}
                      {source && <> · sorted by {source === 'claude' ? 'Claude' : 'simple rules'}</>}
                    </>
                  ) : (
                    'Nothing actionable found.'
                  )}
                </p>
              </div>
              <div className={s.btnRow}>
                {drafts.length > 1 && (
                  <button
                    type="button"
                    className={s.btn}
                    onClick={() => {
                      if (showDeck) setMode('list');
                      else {
                        setDecided(new Set());
                        setMode('deck');
                      }
                    }}
                  >
                    {showDeck ? <List size={15} aria-hidden /> : <Layers size={15} aria-hidden />} {showDeck ? 'All cards' : 'One by one'}
                  </button>
                )}
                {!showDeck && drafts.length > 1 && (
                  <button type="button" className={s.btn} onClick={() => setAll(kept.length !== drafts.length)} data-snd="low">
                    {kept.length === drafts.length ? 'Select none' : 'Select all'}
                  </button>
                )}
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
            </div>
            {source === 'rules' && drafts.length > 0 && (
              <p className={s.nothing}>Sorted by simple rules — no AI key set — so check the names.</p>
            )}

            {showDeck ? (
              <SwipeDeck queue={queue} decided={decided.size} total={drafts.length} projects={projects ?? []} onDecide={decide} />
            ) : (
              drafts.map((d, i) => <ProposalCard key={d.key} draft={d} index={i} projects={projects ?? []} onChange={updateDraft} />)
            )}

            {!showDeck && missingProject > 0 && (
              <div className={`${s.notice} ${s.noticeWarn} ${s.rise}`}>
                <span>{missingProject === 1 ? '1 mission needs' : `${missingProject} missions need`} a project.</span>
                {projects && projects.length > 0 && (
                  <select
                    aria-label="Put all unassigned missions in"
                    className={s.selectField}
                    value=""
                    onChange={(e) => e.target.value && setDrafts((ds) => (ds ? assignUnassigned(ds, e.target.value) : ds))}
                  >
                    <option value="">Put all unassigned in…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <form onSubmit={createProject} className={s.form} style={{ flex: 1, minWidth: '16rem' }}>
                  <input
                    aria-label="New project name"
                    placeholder="Or a new project"
                    maxLength={255}
                    value={newProject}
                    onChange={(e) => setNewProject(e.target.value)}
                    className={s.field}
                  />
                  <button type="submit" className={s.btn} disabled={!newProject.trim() || busy !== null} data-snd="drum">
                    <Plus size={15} aria-hidden /> {busy === 'project' ? 'Creating…' : 'Create'}
                  </button>
                </form>
              </div>
            )}

            {!showDeck && drafts.length > 0 && (
              <div className={s.form} style={{ justifyContent: 'flex-end' }}>
                {badEstimate && <span className={s.formError} style={{ width: 'auto' }}>Estimates are whole minutes, 1–1440.</span>}
                {badName && <span className={s.formError} style={{ width: 'auto' }}>Every mission needs a name.</span>}
                <kbd className={s.kbd} style={{ marginLeft: 0 }}>
                  ⌘ Enter
                </kbd>
                <button type="button" className={`${s.btn} ${s.btnDark}`} disabled={!canAdd} onClick={add} data-snd="high">
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
