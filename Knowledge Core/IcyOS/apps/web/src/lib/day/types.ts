import { z } from 'zod';

// Timeline, Focus and Review: shapes shared by the pages, routes and logic.
// No server-only imports.

export type BlockKind = 'mission' | 'buffer' | 'break';

export interface PlanBlock {
  kind: BlockKind;
  /** Set for mission blocks. */
  missionId: string | null;
  title: string;
  /** ISO timestamps. */
  start: string;
  end: string;
}

export interface UnscheduledMission {
  missionId: string;
  title: string;
  minutes: number;
}

export interface ProposedPlan {
  blocks: PlanBlock[];
  /** Open missions that didn't fit in the window. */
  unscheduled: UnscheduledMission[];
  /** How much longer than usual buffers are, from recent focus sessions (1 = usual). */
  bufferScale: number;
  /** One sentence on why the plan looks the way it does. */
  reason: string;
}

export interface SavedPlan {
  date: string;
  approvedAt: string | null;
  blocks: PlanBlock[];
}

export interface FocusSession {
  id: string;
  missionId: string | null;
  startedAt: string;
  pausedAt: string | null;
  pausedSeconds: number;
  endedAt: string | null;
  plannedMinutes: number | null;
  focusSeconds: number | null;
  outcome: 'done' | 'stopped' | null;
}

export interface Insights {
  /** Finished sessions with a plan, over the last 14 days. */
  samples: number;
  /** Average actual ÷ planned focus time, when there are enough samples. */
  ratio: number | null;
  bufferScale: number;
  message: string;
  focusMinutesLast7Days: number;
  sessionsLast7Days: number;
}

export interface DayStats {
  stepsDone: { command: string; missionName: string; completedAt: string }[];
  focusSessions: number;
  focusMinutes: number;
  plannedMissions: number;
  /** Planned missions that got a focus session or a ticked step that day. */
  plannedMissionsWorked: number;
}

export interface SavedReview {
  date: string;
  score: number;
  wentWell: string | null;
  gotInWay: string | null;
  nextTime: string | null;
}

export interface ReviewDay {
  stats: DayStats;
  review: SavedReview | null;
  insights: Insights;
}

/** The user's local calendar date. */
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date like 2026-10-04');

/**
 * The user's local day (or working window) as two instants, from the browser,
 * so the server never guesses a time zone. At most 48 hours long.
 */
export const windowSchema = z
  .object({ start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) })
  .refine((w) => Date.parse(w.end) > Date.parse(w.start), { message: 'The end must be after the start' })
  .refine((w) => Date.parse(w.end) - Date.parse(w.start) <= 48 * 3600_000, { message: 'Keep it within 48 hours' });

export const proposeSchema = z.object({ date: dateSchema }).and(windowSchema);

export const saveSchema = z.object({
  date: dateSchema,
  blocks: z
    .array(
      z.object({
        kind: z.enum(['mission', 'buffer', 'break']),
        missionId: z.string().uuid().nullable(),
        title: z.string().trim().min(1).max(255),
        start: z.string().datetime({ offset: true }),
        end: z.string().datetime({ offset: true }),
      })
    )
    .min(1, 'The plan is empty')
    .max(60),
});

export const startFocusSchema = z.object({
  missionId: z.string().uuid(),
  plannedMinutes: z.number().int().min(1).max(600).nullable().default(null),
});

export const focusActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('pause') }),
  z.object({ action: z.literal('resume') }),
  z.object({ action: z.literal('finish'), outcome: z.enum(['done', 'stopped']) }),
]);

const answer = z.string().trim().max(2000, 'Keep each answer under 2000 characters').nullable().default(null);

export const reviewSchema = z.object({
  date: dateSchema,
  score: z.number().int().min(1).max(10),
  wentWell: answer,
  gotInWay: answer,
  nextTime: answer,
});

/** Seconds of focus so far: time since start, less pauses (including a pause in progress). */
export function elapsedSeconds(s: Pick<FocusSession, 'startedAt' | 'pausedAt' | 'pausedSeconds' | 'endedAt' | 'focusSeconds'>, now = Date.now()): number {
  if (s.endedAt && s.focusSeconds !== null) return s.focusSeconds;
  const until = s.pausedAt ? Date.parse(s.pausedAt) : now;
  return Math.max(0, Math.floor((until - Date.parse(s.startedAt)) / 1000) - s.pausedSeconds);
}
