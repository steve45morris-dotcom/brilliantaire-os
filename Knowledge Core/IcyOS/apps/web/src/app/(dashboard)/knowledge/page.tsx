'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pin, PinOff, Plus, Search, Trash2, AlertCircle, Save, FileText } from 'lucide-react';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import { MAX_NOTE_CHARS, type Note, type NoteSummary } from '../../../lib/knowledge/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

const pad = (n: number) => String(n).padStart(2, '0');

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
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      {children}
    </div>
  );
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
  const editing = draft ? draft.id ?? 'new' : null;

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
    if (!draft || !draft.title.trim() || busy) return;
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
    setSaved((s) => (s ? { ...s, pinned } : s));
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

  return (
    <div className="relative flex flex-col gap-5">
      <Backdrop />

      <PageHeader
        eyebrow="ARCHIVE"
        title="Knowledge"
        aside={
          <div className="flex items-center gap-4">
            {notes && (
              <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">
                {pad(notes.length)} NOTES · {pad(pinnedCount)} PINNED
              </span>
            )}
            <TacButton onClick={startNew}>
              <Plus size={13} /> NEW NOTE
            </TacButton>
          </div>
        }
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">Notes, decisions and anything worth remembering, linked to your projects.</p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* ── Index ── */}
        <div className="flex flex-col gap-2.5 min-w-0">
          <SectionLabel>INDEX</SectionLabel>
          <label className="relative">
            <span className="sr-only">Search notes</span>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4d5a] pointer-events-none" />
            <input
              value={query}
              maxLength={200}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the archive"
              className="w-full pl-9 pr-3 min-h-[40px] bg-[#08090e] border border-[#1e2030] rounded-md text-[13.5px] text-[#e0dcd2] placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors"
            />
          </label>
          {notes === null ? (
            <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a] py-4">// INDEXING</span>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-[#1e2030] rounded-lg">
              <FileText size={18} className="text-[#2a2d3a]" />
              <span className="font-tactical text-[10px] tracking-[0.14em] text-[#4a4d5a] text-center px-4">
                {query.trim() ? 'NO MATCHES' : 'ARCHIVE EMPTY'}
              </span>
            </div>
          ) : (
            <ul aria-label="Notes" className="flex flex-col gap-1.5">
              {notes.map((n, i) => {
                const on = draft?.id === n.id;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void open(n.id)}
                      aria-current={on ? 'true' : undefined}
                      className="group relative w-full text-left px-3.5 py-3 rounded-md transition-all overflow-hidden"
                      style={{
                        background: on ? 'linear-gradient(160deg, #15161f 0%, #0e0f16 100%)' : 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)',
                        border: `1px solid ${on ? 'rgba(201,168,76,0.45)' : '#1e2030'}`,
                        boxShadow: on ? '0 0 20px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.12)' : 'none',
                      }}
                    >
                      {on && <CornerBrackets color="rgba(201,168,76,0.7)" size={10} />}
                      {!on && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.2)' }} />}
                      <span className="flex items-center gap-2 font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a]">
                        <span>N-{pad(i + 1)}</span>
                        {n.pinned && <Pin size={10} className="text-[#c9a84c]" aria-label="Pinned" />}
                        <span className="ml-auto tabular-nums">{when(n.updatedAt)}</span>
                      </span>
                      <span className={`block text-[14px] font-semibold truncate mt-1 ${on ? 'text-[#ece8de]' : 'text-[#cfcbc3] group-hover:text-[#ece8de]'}`}>{n.title}</span>
                      {n.excerpt && <span className="block text-[12px] text-[#6b6e7a] truncate mt-0.5">{n.excerpt}</span>}
                      {n.projectName && <span className="block font-tactical text-[9px] tracking-[0.12em] text-[#4a4d5a] truncate mt-1.5">{n.projectName.toUpperCase()}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Editor ── */}
        <div className="flex flex-col gap-2.5 min-w-0">
          <SectionLabel>{draft ? (draft.id ? 'RECORD' : 'NEW RECORD') : 'VIEWER'}</SectionLabel>
          {draft ? (
            <div ref={editorRef} className="min-w-0 scroll-mt-4">
              <Panel>
                <form onSubmit={save} className="flex flex-col">
                  <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[#1e2030]">
                    <input
                      aria-label="Title"
                      autoFocus={!draft.id}
                      maxLength={255}
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Untitled record"
                      className="flex-1 min-w-0 bg-transparent text-xl font-semibold text-[#ece8de] placeholder:text-[#4a4d5a] focus:outline-none"
                    />
                    {draft.id && (
                      <>
                        <button type="button" onClick={togglePin} disabled={busy} aria-label={draft.pinned ? 'Unpin' : 'Pin'} className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded transition-colors ${draft.pinned ? 'text-[#c9a84c] bg-[#c9a84c]/10' : 'text-[#4a4d5a] hover:text-[#c9a84c]'}`}>
                          {draft.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                        </button>
                        <button type="button" onClick={remove} aria-label="Delete note" className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#4a4d5a] hover:text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="px-5 pt-4">
                    <textarea
                      aria-label="Note text"
                      rows={14}
                      maxLength={MAX_NOTE_CHARS}
                      value={draft.body}
                      onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                      placeholder="Write it down…"
                      className="w-full px-4 py-3 bg-[#08090e] border border-[#1e2030] rounded-md text-[14.5px] text-[#e0dcd2] leading-relaxed placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors resize-y"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">PROJECT</span>
                      <select
                        value={draft.projectId}
                        onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
                        className="px-3 min-h-[36px] bg-[#08090e] border border-[#1e2030] rounded-md text-[13px] text-[#e0dcd2] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                      >
                        <option value="">Unlinked</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[10rem] flex flex-col gap-1.5 self-end pb-1">
                      <div className="h-[3px] w-full rounded-sm bg-[#1e2030] overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${fill * 100}%`, background: fill > 0.9 ? '#f87171' : '#c9a84c' }} />
                      </div>
                      <span className="font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a] tabular-nums">
                        <span className={dirty ? 'text-[#fbbf24]' : 'text-[#4a4d5a]'}>{dirty ? 'UNSAVED' : draft.id ? 'SYNCED' : 'DRAFT'}</span>
                        {' · '}
                        <span className="text-[#b8b4ac]">{draft.body.length.toLocaleString()}</span> / {MAX_NOTE_CHARS.toLocaleString()}
                      </span>
                    </div>
                    <div className="self-end">
                      <TacButton type="submit" disabled={!draft.title.trim() || !dirty || busy}>
                        <Save size={12} /> {busy ? 'SAVING…' : draft.id ? 'SAVE' : 'ADD RECORD'}
                      </TacButton>
                    </div>
                  </div>
                </form>
              </Panel>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center gap-3 py-24 rounded-lg border border-dashed border-[#1e2030]" style={{ background: 'rgba(10,11,16,0.4)' }}>
              <FileText size={22} className="text-[#2a2d3a]" />
              <span className="font-tactical text-[10px] tracking-[0.18em] text-[#4a4d5a]">SELECT A RECORD OR START A NEW ONE</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
