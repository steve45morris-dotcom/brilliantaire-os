'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { ProposalCard, type Draft, type ProjectOption } from '../../../components/inbox/proposal-card';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';
import { MAX_DUMP_CHARS, type SortResult } from '../../../lib/inbox/types';
import type { WorkspaceOverview } from '../../../lib/workspace/overview';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const pad = (n: number) => String(n).padStart(2, '0');

/** Steps as typed, one per non-blank line. */
const stepsOf = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);

/** A whole number of minutes from 1 to 1440, null when blank, NaN when invalid. */
function minutesOf(text: string): number | null {
  if (!text.trim()) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= 1440 ? n : NaN;
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
  const lines = text ? text.split('\n').length : 0;

  if (!hasWorkspace) {
    return (
      <div className="relative flex flex-col gap-5">
        <Backdrop />
        <PageHeader eyebrow="INTAKE" title="Inbox" />
        <Panel className="px-6 py-8 flex flex-col items-start gap-3">
          <span className="font-tactical text-[11px] tracking-[0.14em] text-[#b8b4ac]">NO WORKSPACE CONFIGURED</span>
          <a href="/onboarding" className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">INITIALIZE WORKSPACE</a>
        </Panel>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-5 max-w-4xl">
      <Backdrop />

      <PageHeader
        eyebrow="INTAKE"
        title="Inbox"
        aside={
          <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">
            {projects ? `${pad(projects.length)} PROJECTS ONLINE` : 'LINKING…'}
          </span>
        }
      />

      <p className="text-sm text-[#8a8d9a] -mt-2">
        Empty your head here. IcyOS turns it into missions you review before anything is saved.
      </p>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.05)' }}>
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p role="alert" className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {added !== null && (
        <div
          className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-emerald-500/25 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(52,211,153,0.07), transparent)', boxShadow: '0 0 20px rgba(52,211,153,0.06)' }}
        >
          <CornerBrackets color="rgba(52,211,153,0.5)" size={12} />
          <span className="inline-flex items-center gap-2 font-tactical text-[11px] tracking-[0.14em] text-emerald-300">
            <CheckCircle2 size={14} /> {pad(added)} {added === 1 ? 'MISSION' : 'MISSIONS'} COMMITTED
          </span>
          <a href="/dashboard" className="font-tactical text-[11px] tracking-[0.14em] text-[#c9a84c] hover:underline">VIEW ON DASHBOARD →</a>
        </div>
      )}

      {/* ── Dump state ── */}
      {!drafts && (
        <form onSubmit={sort} className="flex flex-col gap-2.5">
          <SectionLabel>SIGNAL INPUT</SectionLabel>
          <Panel>
            <div className="flex items-center justify-between px-5 pt-4 pb-2 font-tactical text-[10px] tracking-[0.18em]">
              <span className="inline-flex items-center gap-2 text-[#6b6e7a]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] hud-pulse-gold" />
                BRAIN DUMP · RAW
              </span>
              <span className="text-[#4a4d5a] tabular-nums">
                {pad(lines)} LN
              </span>
            </div>
            <div className="px-5 pb-4">
              <textarea
                aria-label="Brain dump"
                autoFocus
                rows={10}
                maxLength={MAX_DUMP_CHARS}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'Everything on your mind, as messy as you like:\n- email the printer about posters (30 min)\n- podcast: book a guest, write questions\n- gym 1h, call mum…'}
                className="w-full px-4 py-3 bg-[#08090e] border border-[#1e2030] rounded-md text-[15px] text-[#e0dcd2] leading-relaxed placeholder:text-[#4a4d5a] focus:outline-none focus:border-[#c9a84c]/50 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)] transition-colors resize-y"
              />
            </div>
            <div className="flex items-center gap-4 px-5 pb-4">
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-[3px] w-full rounded-sm bg-[#1e2030] overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${fill * 100}%`, background: fill > 0.9 ? '#f87171' : '#c9a84c', boxShadow: fill > 0 ? '0 0 6px rgba(201,168,76,0.5)' : 'none' }}
                  />
                </div>
                <span className="font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a] tabular-nums">
                  <span className="text-[#b8b4ac]">{text.length.toLocaleString()}</span> / {MAX_DUMP_CHARS.toLocaleString()} BUFFER
                </span>
              </div>
              <TacButton type="submit" disabled={!text.trim() || busy !== null}>
                <Sparkles size={13} /> {busy === 'sort' ? 'SORTING…' : 'SORT IT'}
              </TacButton>
            </div>
          </Panel>
        </form>
      )}

      {/* ── Review state ── */}
      {drafts && (
        <>
          <SectionLabel>PROPOSED MISSIONS</SectionLabel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-tactical text-[10px] tracking-[0.16em] text-[#6b6e7a] flex items-center gap-2 flex-wrap">
              {drafts.length ? (
                <>
                  <span className="text-[#e0dcd2]">{pad(drafts.length)}</span> {drafts.length === 1 ? 'MISSION' : 'MISSIONS'} DETECTED
                  <span className="text-[#2a2d3a]">·</span>
                  <span className="text-[#4a4d5a]">{pad(kept.length)} SELECTED</span>
                  {source && (
                    <>
                      <span className="text-[#2a2d3a]">·</span>
                      <span className={source === 'claude' ? 'text-[#c9a84c]' : 'text-[#4a4d5a]'}>
                        SOURCE {source === 'claude' ? 'CLAUDE' : 'RULES'}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span>NOTHING ACTIONABLE DETECTED</span>
              )}
            </div>
            <TacButton variant="ghost" onClick={() => { setDrafts(null); setSource(null); }}>
              <ArrowLeft size={12} /> BACK TO TEXT
            </TacButton>
          </div>
          {source === 'rules' && drafts.length > 0 && (
            <p className="text-xs text-[#6b6e7a] -mt-1">Sorted by simple rules — no AI key set — so check the names.</p>
          )}

          <div className="flex flex-col gap-2.5">
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
            <form
              onSubmit={createProject}
              className="relative flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 overflow-hidden"
              style={{ background: 'linear-gradient(160deg, rgba(245,158,11,0.06), transparent)' }}
            >
              <CornerBrackets color="rgba(245,158,11,0.5)" size={12} />
              <span className="font-tactical text-[10px] tracking-[0.14em] text-amber-200">
                {pad(missingProject)} {missingProject === 1 ? 'MISSION NEEDS' : 'MISSIONS NEED'} A PROJECT — PICK ABOVE OR CREATE
              </span>
              <Input
                aria-label="New project name"
                placeholder="New project name"
                maxLength={255}
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
                className="flex-1 min-w-[12rem] !min-h-[38px] !py-1.5 !rounded-md !text-sm"
              />
              <TacButton type="submit" variant="ghost" disabled={!newProject.trim() || busy !== null}>
                <Plus size={12} /> {busy === 'project' ? 'CREATING…' : 'CREATE'}
              </TacButton>
            </form>
          )}

          {drafts.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              {badEstimate && <span className="font-tactical text-[9px] tracking-[0.12em] text-red-400">ESTIMATES: WHOLE MINUTES 1–1440</span>}
              {badName && <span className="font-tactical text-[9px] tracking-[0.12em] text-red-400">EVERY MISSION NEEDS A NAME</span>}
              <TacButton disabled={!canAdd} onClick={add}>
                <Plus size={13} /> {busy === 'add' ? 'ADDING…' : `COMMIT ${pad(kept.length)} ${kept.length === 1 ? 'MISSION' : 'MISSIONS'}`}
              </TacButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
