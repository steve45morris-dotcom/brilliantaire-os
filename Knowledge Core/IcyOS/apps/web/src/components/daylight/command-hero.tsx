'use client';

import Link from 'next/link';
import { ArrowRight, Play, Plus } from 'lucide-react';
import type { MissionStatus } from '@icyos/shared';
import { openPalette } from '../layout/command-palette';
import { greeting, statusCounts } from '../../lib/workspace/daylight';
import type { MissionView, ProjectView } from '../../lib/workspace/overview';
import { useClock } from './daylight-fx';
import s from './daylight.module.css';

const STATUS_ORDER: readonly MissionStatus[] = ['Staged', 'Approved', 'Running', 'Completed', 'Failed', 'Skipped'];
const STATUS_CLASS: Record<MissionStatus, string> = {
  Staged: s.sStaged,
  Approved: s.sApproved,
  Running: s.sRunning,
  Completed: s.sCompleted,
  Failed: s.sFailed,
  Skipped: s.sSkipped,
};

function Words({ text, delay }: { text: string; delay: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={`${w}-${i}`} className={s.word} style={{ animationDelay: `${delay + i * 0.07}s` }}>
          {w}
          {' '}
        </span>
      ))}
    </>
  );
}

function lead(featured: MissionView | null): string {
  if (!featured) return 'Nothing is active in this project right now.';
  if (featured.status === 'Running') return 'Your current mission is running.';
  if (featured.status === 'Approved') return 'Your current mission is approved and ready to start.';
  return 'Your current mission is staged and waiting for you.';
}

interface CommandHeroProps {
  workspaceName: string;
  projects: readonly ProjectView[];
  steps: { done: number; total: number };
  featured: MissionView | null;
  onNewMission: (() => void) | null;
  onNewProject: () => void;
}

export function CommandHero({ workspaceName, projects, steps, featured, onNewMission, onNewProject }: CommandHeroProps) {
  const now = useClock();
  const counts = statusCounts(projects);
  const date = now
    ? `${now.toLocaleDateString('en-GB', { weekday: 'long' })} ${now.getDate()} ${now.toLocaleDateString('en-GB', { month: 'long' })} ${now.getFullYear()}`
    : null;
  const time = now?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <section className={s.hero} aria-label="Command">
      <span className={s.floor} aria-hidden />
      <p className={s.meta}>
        {workspaceName} · {date ?? '—'} · {time ?? '--:--:--'}
      </p>
      <h1 className={s.h1}>
        <Words text={`${greeting(now?.getHours() ?? 9)}, Commander.`} delay={0.05} />
        <span className={s.h1em}>
          <Words text="What do we move today?" delay={0.3} />
        </span>
      </h1>
      <p className={s.sub}>{lead(featured)} Type a command or pick one below.</p>

      <div className={s.cmd}>
        <button type="button" className={s.cmdInput} onClick={openPalette} aria-label="Search commands, projects and missions (⌘K)">
          <span className={s.caret} aria-hidden />
          Search commands, projects, missions…
          <kbd className={s.kbd}>⌘K</kbd>
          <span className={s.go} aria-hidden>
            <ArrowRight size={18} />
          </span>
        </button>
        <div className={s.chips}>
          {featured ? (
            <Link href={`/focus?mission=${featured.id}`} className={`${s.chip} ${s.chipDark}`} data-snd="drum">
              <Play size={13} aria-hidden /> Start focus · <b>{featured.name}</b>
            </Link>
          ) : (
            <Link href="/focus" className={`${s.chip} ${s.chipDark}`} data-snd="drum">
              <Play size={13} aria-hidden /> Start focus
            </Link>
          )}
          {onNewMission && (
            <button type="button" className={s.chip} onClick={onNewMission}>
              <Plus size={13} aria-hidden /> New mission
            </button>
          )}
          <button type="button" className={s.chip} onClick={onNewProject}>
            <Plus size={13} aria-hidden /> New project
          </button>
          <Link href="/review" className={s.chip}>
            Weekly <b>review</b>
          </Link>
          <Link href="/pjk" className={s.chip}>
            Open P.J.K.
          </Link>
        </div>
      </div>

      <ul className={s.strip} aria-label="Workspace totals" style={{ listStyle: 'none', padding: 0 }}>
        <li className={s.count}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </li>
        {STATUS_ORDER.filter((st) => counts[st] > 0).map((st) => (
          <li key={st} className={`${s.count} ${STATUS_CLASS[st]}`}>
            {counts[st]} {st.toLowerCase()}
          </li>
        ))}
        <li className={s.count}>
          {steps.done} / {steps.total} steps
        </li>
      </ul>
    </section>
  );
}
