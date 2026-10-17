import type { MissionStatus } from '@icyos/shared';
import type { MissionView, ProjectView } from './overview';

// Presentation rules for the Daylight Command dashboard. Pure functions over the
// existing WorkspaceOverview, so nothing new is persisted for the redesign.

export const ACTIVE_STATUSES: ReadonlySet<MissionStatus> = new Set<MissionStatus>(['Staged', 'Approved', 'Running']);

const FEATURE_ORDER: readonly MissionStatus[] = ['Running', 'Approved', 'Staged'];

export type UpNextFilter = 'all' | 'active' | 'completed';

export interface UpNextRow {
  mission: MissionView;
  project: ProjectView;
}

export interface WeekDay {
  label: string;
  day: number;
  isToday: boolean;
  key: string;
}

/** The selected project's first Running mission, else its first Approved, else its first Staged. */
export function featuredMission(project: ProjectView | null): MissionView | null {
  if (!project) return null;
  for (const status of FEATURE_ORDER) {
    const found = project.missions.find((m) => m.status === status);
    if (found) return found;
  }
  return null;
}

/** Missions per status. Completed is counted as itself; Failed and Skipped stay separate. */
export function statusCounts(projects: readonly ProjectView[]): Record<MissionStatus, number> {
  const counts: Record<MissionStatus, number> = { Staged: 0, Approved: 0, Running: 0, Completed: 0, Failed: 0, Skipped: 0 };
  for (const m of projects.flatMap((p) => p.missions)) counts[m.status] += 1;
  return counts;
}

function matches(status: MissionStatus, filter: UpNextFilter): boolean {
  if (filter === 'active') return ACTIVE_STATUSES.has(status);
  if (filter === 'completed') return status === 'Completed';
  return true;
}

/** Every mission except the featured one, across projects, in source order. */
export function upNext(projects: readonly ProjectView[], featuredId: string | null, filter: UpNextFilter): UpNextRow[] {
  return projects.flatMap((project) =>
    project.missions
      .filter((mission) => mission.id !== featuredId && matches(mission.status, filter))
      .map((mission) => ({ mission, project }))
  );
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Monday to Sunday of the week containing `now`, in the viewer's local time. */
export function weekDays(now: Date): WeekDay[] {
  const offset = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
  return DAY_LABELS.map((label, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return { label, day: d.getDate(), isToday: i === offset, key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` };
  });
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  return 'Good evening';
}
