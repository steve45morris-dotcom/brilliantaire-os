import { z } from 'zod';

// Shared by the Inbox page, its API routes and the parsers. No server-only imports.

/** One mission the Inbox proposes from a brain-dump. Nothing is saved until the user adds it. */
export interface ProposedMission {
  name: string;
  steps: string[];
  /** An existing project it belongs to, or null when the user must choose. */
  projectId: string | null;
  estimatedMinutes: number | null;
}

export interface SortResult {
  /** Who sorted it: Claude, or the rule-based parser when no AI key is set or Claude failed. */
  source: 'claude' | 'rules';
  missions: ProposedMission[];
}

export const MAX_DUMP_CHARS = 8000;
export const MAX_PROPOSED = 50;

export const sortSchema = z.object({
  text: z.string().trim().min(1, 'Write something to sort').max(MAX_DUMP_CHARS, `Keep it under ${MAX_DUMP_CHARS} characters`),
});

const name = (label: string, max: number) => z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

/** What POST /api/inbox/add accepts: the reviewed missions, each with a project chosen. */
export const addSchema = z.object({
  missions: z
    .array(
      z.object({
        projectId: z.string().uuid('Choose a project for every mission'),
        name: name('Mission name', 255),
        steps: z.array(name('Step', 512)).max(50).default([]),
        estimatedMinutes: z.number().int().min(1).max(1440).nullable().default(null),
      })
    )
    .min(1, 'Nothing to add')
    .max(MAX_PROPOSED, `Add at most ${MAX_PROPOSED} missions at a time`),
});

export type AddInput = z.infer<typeof addSchema>;
