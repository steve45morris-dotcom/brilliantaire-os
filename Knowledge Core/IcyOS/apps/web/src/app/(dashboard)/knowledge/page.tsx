'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Pin, PinOff, Plus, Save, Search, Trash2 } from 'lucide-react';
import type { PendingDelete } from '../../../components/dashboard/confirm-delete';
import { Words } from '../../../components/daylight/command-hero';
import { DaylightConfirm } from '../../../components/daylight/daylight-confirm';
import { DaylightFrame } from '../../../components/daylight/daylight-nav';
import s from '../../../components/daylight/daylight.module.css';
import { apiFetch } from '../../../lib/api/client';
import { MAX_NOTE_CHARS, type Note, type NoteSummary } from '../../../lib/knowledge/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

interface Draft {
  /** Null for a note that isn't saved yet. */
  id: string | null;
  title: string;
  body: string;
  projectId: string;
  pinned: boolean;
}

const EMPTY: Draft = { id: null, title: '', body: '', projectId: '', pinned: false };
const draftOf = (n: Note): Draft => ({ id: n.id, title: n.title, body: n.body, projectId: n.projectId ?? '', pinned: n.pinned });
const same = (a: Draft, b: Draft) => a.title === b.title && a.body === b.body && a.projectId === b.projectId;

function when(iso: string): string {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function KnowledgePage() {
  const [notes, setNotes] = useState<NoteSummary[] | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<PendingDelete | null>(null);
  const searchSeq = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const editing = draft ? (draft.id ?? 'new') : null;

  // On narrow screens the editor sits under the list, so bring it into view.
  useEffect(() => {
    if (editing && window.matchMedia('(max-width: 1023px)').matches) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editing]);

  const load = useCallback(async (q: string) => {
    const seq = ++searchSeq.current;
    const res = await apiFetch<{ notes: NoteSummary[] }>(`/api/knowledge${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    if (seq !== searchSeq.current) return; // a newer search has started
    if (res.success && res.data) setNotes(res.data.notes);
    else setError(res.error?.message ?? 'Could not load your notes');
  }, []);

  useEffect(() => {
    void apiFetch<WorkspaceOverview>('/api/workspace').then((res) => {
      if (res.success && res.data) setProjects(res.data.projects.map((p) => ({ id: p.id, name: p.name })));
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(query), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [query, load]);

  const dirty = Boolean(draft && (saved ? !same(draft, saved) : draft.title.trim() || draft.body.trim()));

  function leave(): boolean {
    return !dirty || window.confirm('Discard your unsaved changes?');
  }

  async function open(id: string) {
    if (draft?.id === id || !leave()) return;
    setError(null);
    const res = await apiFetch<Note>(`/api/knowledge/${id}`);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not open that note');
      return;
    }
    setDraft(draftOf(res.data));
    setSaved(draftOf(res.data));
  }

  function startNew() {
    if (!leave()) return;
    setError(null);
    setDraft({ ...EMPTY });
    setSaved(null);
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    if (!draft || !draft.title.trim() || !dirty || busy) return;
    setBusy(true);
    setError(null);
    const body = { title: draft.title, body: draft.body, projectId: draft.projectId || null };
    const res = draft.id
      ? await apiFetch<Note>(`/api/knowledge/${draft.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      : await apiFetch<Note>('/api/knowledge', { method: 'POST', body: JSON.stringify(body) });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not save the note');
      return;
    }
    setDraft(draftOf(res.data));
    setSaved(draftOf(res.data));
    await load(query);
  }

  async function togglePin() {
    if (!draft?.id || busy) return;
    setBusy(true);
    const res = await apiFetch<Note>(`/api/knowledge/${draft.id}`, { method: 'PATCH', body: JSON.stringify({ pinned: !draft.pinned }) });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.error?.message ?? 'Could not pin the note');
      return;
    }
    const pinned = res.data.pinned;
    setDraft((d) => (d ? { ...d, pinned } : d));
    setSaved((x) => (x ? { ...x, pinned } : x));
    await load(query);
  }

  function remove() {
    if (!draft?.id) return;
    const id = draft.id;
    setConfirming({
      title: `Delete “${saved?.title ?? draft.title}”?`,
      message: "It can't be undone.",
      run: async () => {
        const res = await apiFetch(`/api/knowledge/${id}`, { method: 'DELETE' });
        if (!res.success) {
          setError(res.error?.message ?? 'Could not delete the note');
          return false;
        }
        setDraft(null);
        setSaved(null);
        await load(query);
        return true;
      },
    });
  }

  const pinnedCount = notes?.filter((n) => n.pinned).length ?? 0;
  const fill = draft ? Math.min(1, draft.body.length / MAX_NOTE_CHARS) : 0;
  const words = draft?.body.trim() ? draft.body.trim().split(/\s+/).length : 0;

  return (
    <DaylightFrame>
      <section className={s.hero} aria-label="Knowledge">
        <span className={s.floor} aria-hidden />
        <p className={s.meta}>
          <span className={s.liveDot} aria-hidden />
          {notes ? `${plural(notes.length, 'note')} · ${pinnedCount} pinned` : 'loading…'}
        </p>
        <h1 className={s.h1}>
          <Words text="Knowledge" delay={0.05} />
          <span className={s.h1em}>
            <Words text="Remember everything." delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>Notes, decisions and anything worth remembering, linked to your projects.</p>
        <button type="button" className={`${s.btn} ${s.btnOx}`} onClick={startNew} style={{ marginTop: 18 }} data-snd="high">
          <Plus size={15} aria-hidden /> New note
        </button>
      </section>

      <div className={s.kbPage}>
        {error && (
          <p role="alert" className={`${s.notice} ${s.noticeBad} ${s.rise}`}>
            {error}
          </p>
        )}

        <div className={s.kbGrid}>
          {/* ── Index ── */}
          <div className={`${s.kbIndex} ${s.rise}`}>
            <label className={s.kbSearch}>
              <Search size={16} aria-hidden />
              <span className="sr-only">Search notes</span>
              <input value={query} maxLength={200} onChange={(e) => setQuery(e.target.value)} placeholder="Search your notes" className={s.field} />
            </label>
            {notes === null ? (
              <p className={s.nothing}>Opening your notes…</p>
            ) : notes.length === 0 ? (
              <div className={`${s.card} ${s.kbEmpty}`}>
                <FileText size={20} aria-hidden />
                <span>{query.trim() ? 'No notes match that search.' : 'No notes yet. Start one with New note.'}</span>
              </div>
            ) : (
              <ul aria-label="Notes" className={s.kbList}>
                {notes.map((n, i) => {
                  const on = draft?.id === n.id;
                  return (
                    <li key={n.id} className={s.rise} style={{ animationDelay: `${0.05 + i * 0.03}s` }}>
                      <button type="button" onClick={() => void open(n.id)} aria-current={on ? 'true' : undefined} className={s.kbNote} data-on={on || undefined} data-snd="high">
                        <span className={s.kbNoteTop}>
                          {n.pinned && <Pin size={12} aria-label="Pinned" className={s.kbPin} />}
                          <span className={s.kbNoteTitle}>{n.title}</span>
                          <span className={s.kbWhen}>{when(n.updatedAt)}</span>
                        </span>
                        {n.excerpt && <span className={s.kbExcerpt}>{n.excerpt}</span>}
                        {n.projectName && <span className={s.kbProject}>{n.projectName}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Editor ── */}
          <div ref={editorRef} className={s.kbEditorWrap}>
            {draft ? (
              <form
                onSubmit={save}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    void save();
                  }
                }}
                className={`${s.card} ${s.kbEditor} ${s.rise}`}
                aria-label={draft.id ? 'Edit note' : 'New note'}
              >
                <div className={s.kbHead}>
                  <span className={s.kbState} data-dirty={dirty || undefined}>
                    {dirty ? 'Unsaved changes' : draft.id ? 'Saved' : 'New note'}
                  </span>
                  {draft.id && (
                    <span className={s.btnRow}>
                      <button type="button" onClick={togglePin} disabled={busy} aria-label={draft.pinned ? 'Unpin' : 'Pin'} aria-pressed={draft.pinned} className={s.kbIcon} data-on={draft.pinned || undefined}>
                        {draft.pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
                      </button>
                      <button type="button" onClick={remove} aria-label="Delete note" className={`${s.kbIcon} ${s.kbDanger}`} data-snd="low">
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </span>
                  )}
                </div>
                <input
                  aria-label="Title"
                  autoFocus={!draft.id}
                  maxLength={255}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Untitled note"
                  className={s.kbTitle}
                />
                <textarea
                  aria-label="Note text"
                  rows={14}
                  maxLength={MAX_NOTE_CHARS}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="Write it down…"
                  className={s.kbBody}
                />
                <div className={s.kbFoot}>
                  <label className={s.kbField}>
                    <span className={s.kbLabel}>Project</span>
                    <select value={draft.projectId} onChange={(e) => setDraft({ ...draft, projectId: e.target.value })} className={s.selectField}>
                      <option value="">Not linked</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={s.kbCount}>
                    <span className={s.g} style={{ display: 'block', flex: 'none' }} aria-hidden>
                      <span className={s.fill} style={{ width: `${fill * 100}%`, background: fill > 0.9 ? 'var(--bad)' : undefined }} />
                    </span>
                    <span className={s.kbLabel}>
                      {plural(words, 'word')} · {draft.body.length.toLocaleString()} / {MAX_NOTE_CHARS.toLocaleString()} characters
                    </span>
                  </div>
                  <kbd className={s.kbd}>⌘ S</kbd>
                  <button type="submit" className={`${s.btn} ${s.btnOx}`} disabled={!draft.title.trim() || !dirty || busy} data-snd="drum">
                    <Save size={15} aria-hidden /> {busy ? 'Saving…' : draft.id ? 'Save' : 'Add note'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={`${s.card} ${s.cmd} ${s.kbIdle} ${s.rise}`}>
                <FileText size={26} aria-hidden />
                <p>Pick a note to read it, or start a new one.</p>
                <button type="button" className={`${s.btn} ${s.chamberGold}`} onClick={startNew} data-snd="high">
                  <Plus size={15} aria-hidden /> New note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DaylightConfirm pending={confirming} onClose={() => setConfirming(null)} />
    </DaylightFrame>
  );
}
