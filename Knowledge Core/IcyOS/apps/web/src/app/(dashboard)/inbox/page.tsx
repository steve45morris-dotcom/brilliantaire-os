'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ProposalCard, type Draft, type ProjectOption } from '../../../components/inbox/proposal-card';
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

  if (!hasWorkspace) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Inbox</h1>
        <Card className="flex flex-col items-start gap-3">
          <span className="text-sm text-zinc-300">Set up your workspace first.</span>
          <a href="/onboarding" className="text-sm text-pink-400 hover:underline">Set it up</a>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Inbox</h1>
        <p className="text-zinc-500 text-sm">Empty your head here. IcyOS turns it into missions you can review before adding.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {added !== null && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-emerald-500/30">
          <span className="text-sm text-emerald-300">Added {plural(added, 'mission')}.</span>
          <a href="/dashboard" className="text-sm text-pink-400 hover:underline">See them on the dashboard</a>
        </Card>
      )}

      {!drafts && (
        <form onSubmit={sort} className="flex flex-col gap-3">
          <textarea
            aria-label="Brain dump"
            autoFocus
            rows={9}
            maxLength={MAX_DUMP_CHARS}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Everything on your mind, as messy as you like:\n- email the printer about posters (30 min)\n- podcast: book a guest, write questions\n- gym 1h, call mum…'}
            className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 leading-relaxed focus:outline-none focus:border-pink-500"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-zinc-600">
              {text.length.toLocaleString()} / {MAX_DUMP_CHARS.toLocaleString()}
            </span>
            <Button type="submit" className="inline-flex items-center gap-2" disabled={!text.trim() || busy !== null}>
              <Sparkles size={16} /> {busy === 'sort' ? 'Sorting…' : 'Sort it'}
            </Button>
          </div>
        </form>
      )}

      {drafts && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              {drafts.length ? `${plural(drafts.length, 'mission')} found` : 'Nothing to do found in that.'}
              {source === 'rules' && drafts.length > 0 && (
                <span className="text-zinc-600"> · sorted by simple rules, so check the names</span>
              )}
              {source === 'claude' && <span className="text-zinc-600"> · sorted by Claude</span>}
            </p>
            <Button variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => { setDrafts(null); setSource(null); }}>
              Back to the text
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {drafts.map((d, i) => (
              <ProposalCard
                key={d.key}
                draft={d}
                index={i}
                projects={projects ?? []}
                onChange={(next) => setDrafts((ds) => ds?.map((x) => (x.key === d.key ? next : x)) ?? ds)}
              />
            ))}
          </div>

          {missingProject > 0 && (
            <form onSubmit={createProject} className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-amber-200">
                {plural(missingProject, 'mission')} {missingProject === 1 ? 'needs' : 'need'} a project. Pick one above, or make a new one:
              </span>
              <Input
                aria-label="New project name"
                placeholder="New project name"
                maxLength={255}
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="flex-1 min-w-[12rem]"
              />
              <Button type="submit" variant="secondary" disabled={!newProject.trim() || busy !== null}>
                {busy === 'project' ? 'Creating…' : 'Create project'}
              </Button>
            </form>
          )}

          {drafts.length > 0 && (
            <div className="flex items-center justify-end gap-3">
              {badEstimate && <span className="text-xs text-red-400">Estimates must be whole minutes from 1 to 1440.</span>}
              {badName && <span className="text-xs text-red-400">Every mission needs a name.</span>}
              <Button disabled={!canAdd} onClick={add}>
                {busy === 'add' ? 'Adding…' : `Add ${plural(kept.length, 'mission')}`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
