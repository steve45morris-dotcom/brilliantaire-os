import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../lib/api/response';
import { validatePayload } from '../../../lib/api/validation';
import { asCaller, badQuery, queryOf } from '../../../lib/day/route-helpers';
import { createNoteSchema, searchSchema, toNote, toSummary } from '../../../lib/knowledge/types';
import { callWorkFunction } from '../../../lib/workspace/manage';

// The caller's notes, pinned first then newest, optionally filtered by ?q=
// (title or body contains it). At most 200.
export async function GET(req: Request) {
  const q = searchSchema.safeParse(queryOf(req));
  if (!q.success) return badQuery(q.error.issues[0].message);
  return asCaller(req, 'your notes', async ({ db }) => {
    const { data, error } = await db.rpc('search_notes', { query: q.data.q ?? null });
    if (error) throw new Error(`search_notes failed: ${error.message}`);
    return jsonResponse({ notes: ((data as unknown[]) ?? []).map(toSummary) });
  });
}

// Adds a note through create_note() (supabase/migrations/26_knowledge_notes.sql).
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, createNoteSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'create_note', {
    note_title: check.data.title,
    note_body: check.data.body,
    target_project_id: check.data.projectId,
  }, 201, toNote);
}
