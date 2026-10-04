'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ConfirmDelete, type PendingDelete } from '../../../components/dashboard/confirm-delete';
import { apiFetch } from '../../../lib/api/client';
import { MAX_NOTE_CHARS, type Note, type NoteSummary } from '../../../lib/knowledge/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

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
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Knowledge</h1>
          <p className="text-zinc-500 text-sm">Notes, decisions and anything worth remembering, linked to your projects.</p>
        </div>
        <Button className="inline-flex items-center gap-2" onClick={startNew}>
          <Plus size={16} /> New note
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 min-w-0">
          <label className="relative">
            <span className="sr-only">Search notes</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input value={query} maxLength={200} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes" className="w-full !pl-9" />
          </label>
          {notes === null ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-zinc-500">{query.trim() ? 'No notes match that.' : 'No notes yet. Start one with New note.'}</p>
          ) : (
            <ul aria-label="Notes" className="flex flex-col gap-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void open(n.id)}
                    aria-current={draft?.id === n.id ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${draft?.id === n.id ? 'border-pink-500/50 bg-pink-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                  >
                    <span className="flex items-center gap-2">
                      {n.pinned && <Pin size={12} className="text-pink-400 shrink-0" aria-label="Pinned" />}
                      <span className="text-sm font-medium text-zinc-100 truncate">{n.title}</span>
                    </span>
                    {n.excerpt && <span className="block text-xs text-zinc-500 truncate mt-0.5">{n.excerpt}</span>}
                    <span className="block text-[11px] text-zinc-600 mt-1">
                      {when(n.updatedAt)}
                      {n.projectName ? ` · ${n.projectName}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {draft ? (
          <div ref={editorRef} className="min-w-0 scroll-mt-4">
          <Card className="flex flex-col gap-4">
            <form onSubmit={save} className="flex flex-col gap-4">
              <div className="flex items-start gap-2">
                <input
                  aria-label="Title"
                  autoFocus={!draft.id}
                  maxLength={255}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Title"
                  className="flex-1 min-w-0 bg-transparent text-xl font-semibold text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
                {draft.id && (
                  <>
                    <button type="button" onClick={togglePin} disabled={busy} aria-label={draft.pinned ? 'Unpin' : 'Pin'} className="p-1 text-zinc-500 hover:text-pink-400">
                      {draft.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button type="button" onClick={remove} aria-label="Delete note" className="p-1 text-zinc-500 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
              <textarea
                aria-label="Note text"
                rows={14}
                maxLength={MAX_NOTE_CHARS}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write it down…"
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 leading-relaxed focus:outline-none focus:border-pink-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-zinc-500">
                  Project
                  <select
                    value={draft.projectId}
                    onChange={(e) => setDraft({ ...draft, projectId: e.target.value })}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600">
                    {dirty ? 'Unsaved changes' : draft.id ? 'Saved' : ''} · {draft.body.length.toLocaleString()} / {MAX_NOTE_CHARS.toLocaleString()}
                  </span>
                  <Button type="submit" disabled={!draft.title.trim() || !dirty || busy}>
                    {busy ? 'Saving…' : draft.id ? 'Save' : 'Add note'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
          </div>
        ) : (
          <Card className="hidden lg:flex items-center justify-center py-20 border-dashed">
            <span className="text-sm text-zinc-500">Pick a note, or start a new one.</span>
          </Card>
        )}
      </div>

      <ConfirmDelete pending={confirming} onClose={() => setConfirming(null)} />
    </div>
  );
}
