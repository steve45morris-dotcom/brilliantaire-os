import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { MissionStatus, Priority } from '@icyos/shared';

// The signed-in user's workspace with its projects, sprints, missions and steps,
// read in one request through RLS (migrations 16 and 17), so it only ever
// contains the caller's own rows.

export interface StepView {
  id: string;
  command: string;
  completedAt: string | null;
}

export interface MissionView {
  id: string;
  name: string;
  status: MissionStatus;
  sprintName: string;
  /** Planned length in minutes, when known. */
  estimatedMinutes: number | null;
  steps: StepView[];
  stepsDone: number;
}

export interface ProjectView {
  id: string;
  name: string;
  priority: Priority;
  missions: MissionView[];
}

export interface WorkspaceOverview {
  workspace: { id: string; name: string } | null;
  projects: ProjectView[];
  totals: { projects: number; missions: number; activeMissions: number; stepsDone: number; steps: number };
}

const SELECT = `
  id, name, created_at,
  projects (
    id, name, priority, created_at,
    sprints (
      id, sprint_name, created_at,
      missions (
        id, name, status, estimated_minutes, created_at,
        actions ( id, command, position, completed_at, created_at )
      )
    )
  )
`;

interface Row { id: string; created_at: string }
interface ActionRow extends Row { command: string; position: number; completed_at: string | null }
interface MissionRow extends Row { name: string; status: MissionStatus; estimated_minutes?: number | null; actions: ActionRow[] | null }
interface SprintRow extends Row { sprint_name: string; missions: MissionRow[] | null }
interface ProjectRow extends Row { name: string; priority: Priority; sprints: SprintRow[] | null }
export interface WorkspaceRow extends Row { name: string | null; projects: ProjectRow[] | null }

const byCreated = (a: Row, b: Row) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id);
const PRIORITY_ORDER: Record<Priority, number> = { P1: 0, P2: 1, P3: 2 };
const ACTIVE: MissionStatus[] = ['Staged', 'Approved', 'Running'];

/** Orders and flattens the nested rows: projects by priority, missions oldest first, steps by position. */
export function shapeOverview(row: WorkspaceRow | null): WorkspaceOverview {
  if (!row) {
    return { workspace: null, projects: [], totals: { projects: 0, missions: 0, activeMissions: 0, stepsDone: 0, steps: 0 } };
  }

  const projects: ProjectView[] = [...(row.projects ?? [])]
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || byCreated(a, b))
    .map((project) => {
      const missions = [...(project.sprints ?? [])].sort(byCreated).flatMap((sprint) =>
        [...(sprint.missions ?? [])].sort(byCreated).map((mission): MissionView => {
          const steps = [...(mission.actions ?? [])]
            .sort((a, b) => a.position - b.position || byCreated(a, b))
            .map((a) => ({ id: a.id, command: a.command, completedAt: a.completed_at }));
          return {
            id: mission.id,
            name: mission.name,
            status: mission.status,
            sprintName: sprint.sprint_name,
            estimatedMinutes: mission.estimated_minutes ?? null,
            steps,
            stepsDone: steps.filter((s) => s.completedAt).length,
          };
        })
      );
      return { id: project.id, name: project.name, priority: project.priority, missions };
    });

  const missions = projects.flatMap((p) => p.missions);
  return {
    workspace: { id: row.id, name: row.name ?? 'My workspace' },
    projects,
    totals: {
      projects: projects.length,
      missions: missions.length,
      activeMissions: missions.filter((m) => ACTIVE.includes(m.status)).length,
      stepsDone: missions.reduce((n, m) => n + m.stepsDone, 0),
      steps: missions.reduce((n, m) => n + m.steps.length, 0),
    },
  };
}

export async function loadWorkspaceOverview(db: SupabaseClient): Promise<WorkspaceOverview> {
  const { data, error } = await db
    .from('workspaces')
    .select(SELECT)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Workspace overview query failed: ${error.message}`);
  return shapeOverview(data as WorkspaceRow | null);
}

export const setStepSchema = z.object({
  actionId: z.string().uuid(),
  completed: z.boolean(),
});

export interface SetStepResult {
  action_id: string;
  completed_at: string | null;
  mission_id: string;
  mission_status: MissionStatus;
  steps_done: number;
  steps_total: number;
}
