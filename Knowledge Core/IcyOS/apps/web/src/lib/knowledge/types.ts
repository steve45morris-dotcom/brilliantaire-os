import { z } from 'zod';

// Knowledge notes: shapes shared by the page and the routes. Stored in
// memory_entries (supabase/migrations/26_knowledge_notes.sql).

export const MAX_NOTE_CHARS = 20000;

export interface NoteSummary {
  id: string;
  title: string;
  /** The first 200 characters of the body, on one line. */
  excerpt: string;
  projectId: string | null;
  projectName: string | null;
  pinned: boolean;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  projectId: string | null;
  projectName: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const title = z.string().trim().min(1, 'Title is required').max(255, 'Title must be 255 characters or fewer');
const body = z.string().max(MAX_NOTE_CHARS, `A note can be at most ${MAX_NOTE_CHARS} characters`);

export const createNoteSchema = z.object({
  title,
  body: body.default(''),
  projectId: z.string().uuid().nullable().default(null),
});

export const updateNoteSchema = z
  .object({
    title: title.optional(),
    body: body.optional(),
    /** A project id links the note; null removes the link. */
    projectId: z.string().uuid().nullable().optional(),
    pinned: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Nothing to change' });

export const searchSchema = z.object({ q: z.string().max(200, 'Keep the search under 200 characters').optional() });

export function toNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    body: row.body ?? row.content ?? '',
    projectId: row.project_id ?? null,
    projectName: row.project_name ?? row.projects?.name ?? null,
    pinned: Boolean(row.pinned),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toSummary(row: any): NoteSummary {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? '',
    projectId: row.project_id ?? null,
    projectName: row.project_name ?? null,
    pinned: Boolean(row.pinned),
    updatedAt: row.updated_at,
  };
}
