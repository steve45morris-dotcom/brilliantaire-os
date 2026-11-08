'use client';

import Link from 'next/link';
import type { MissionStatus } from '@icyos/shared';
import { useCountUp } from '../dashboard/hud';
import { ACTIVE_STATUSES, upNext, weekDays, type UpNextFilter } from '../../lib/workspace/daylight';
import type { ProjectView } from '../../lib/workspace/overview';
import { tiltHandlers, useClock } from './daylight-fx';
import s from './daylight.module.css';

const DOT_CLASS: Record<MissionStatus, string> = {
  Staged: s.dStaged,
  Approved: s.dApproved,
  Running: s.dRunning,
  Completed: s.dCompleted,
  Failed: s.dFailed,
  Skipped: s.dSkipped,
};

interface UpNextProps {
  projects: readonly ProjectView[];
  featuredId: string | null;
  filter: UpNextFilter;
  onFilter: (f: UpNextFilter) => void;
  onOpen: (projectId: string, missionId: string) => void;
}

export function UpNext({ projects, featuredId, filter, onFilter, onOpen }: UpNextProps) {
  const others = upNext(projects, featuredId, 'all');
  const filters: { key: UpNextFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: others.length },
    { key: 'active', label: 'Active', count: others.filter((r) => ACTIVE_STATUSES.has(r.mission.status)).length },
    { key: 'completed', label: 'Completed', count: others.filter((r) => r.mission.status === 'Completed').length },
  ];
  const rows = upNext(projects, featuredId, filter);

  return (
    <section className={`${s.card} ${s.panel} ${s.tilt} ${s.tiltSoft}`} aria-label="Up next" {...tiltHandlers}>
      <div className={s.ph}>
        Up next
        <span className={s.filters} role="group" aria-label="Filter missions">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              className={`${s.filter} ${filter === f.key ? s.filterOn : ''}`}
              onClick={() => onFilter(f.key)}
            >
              {f.label} {f.count}
            </button>
          ))}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className={s.nothing}>{others.length === 0 ? 'No other missions yet.' : 'Nothing matches this filter.'}</p>
      ) : (
        <ul className={s.nx}>
          {rows.map(({ mission, project }) => (
            <li key={mission.id}>
              <button
                type="button"
                className={s.q}
                style={{ width: '100%', border: 0, textAlign: 'left' }}
                onClick={() => onOpen(project.id, mission.id)}
                aria-label={`${mission.name}, ${mission.status.toLowerCase()}, in ${project.name}. Open this mission.`}
              >
                <i className={`${s.qDot} ${DOT_CLASS[mission.status]} ${mission.status === 'Running' ? s.liveDot : ''}`} aria-hidden style={mission.status === 'Running' ? { margin: 0 } : undefined} />
                <span className={s.qName}>
                  {mission.name} <span>· {project.name}</span>
                </span>
                <span className={s.qStatus}>{mission.status.toLowerCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Total({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const shown = useCountUp(value);
  return (
    <div>
      <div className={s.totL}>{label}</div>
      <div className={s.totV}>
        {shown}
        {suffix}
      </div>
    </div>
  );
}

export function ThisWeek({ activeMissions, stepsDone, steps }: { activeMissions: number; stepsDone: number; steps: number }) {
  const now = useClock();
  const days = now ? weekDays(now) : [];
  return (
    <section className={`${s.card} ${s.panel} ${s.week}`} aria-label="This week">
      <div className={s.ph}>
        This week <Link href="/timeline">Timeline →</Link>
      </div>
      <ol className={s.days} style={{ listStyle: 'none', padding: 0 }}>
        {days.map((d) => (
          <li key={d.key} className={`${s.d} ${d.isToday ? s.dToday : ''}`} aria-current={d.isToday ? 'date' : undefined}>
            {d.label}
            <b>{d.day}</b>
          </li>
        ))}
      </ol>
      <div className={s.tot}>
        <Total label="Active missions" value={activeMissions} />
        <Total label="Steps done, all sprints" value={stepsDone} suffix={` / ${steps}`} />
      </div>
    </section>
  );
}
