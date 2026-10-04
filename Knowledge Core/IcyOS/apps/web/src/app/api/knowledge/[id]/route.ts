import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { asCaller } from '../../../../lib/day/route-helpers';
import { toNote, updateNoteSchema } from '../../../../lib/knowledge/types';
import { callWorkFunction, notFound, routeId } from '../../../../lib/workspace/manage';

type Context = { params: Promise<{ id: string }> };

// One note in full. Someone else's note and a missing one give the same answer.
export async function GET(req: Request, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  return asCaller(req, 'the note', async ({ db }) => {
    const { data, error } = await db
      .from('memory_entries')
      .select('id, title, content, project_id, pinned, created_at, updated_at, projects ( name )')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Loading the note failed: ${error.message}`);
    return data ? jsonResponse(toNote(data)) : notFound();
  });
}

// Changes the title, body, project link or pin; anything left out stays.
export async function PATCH(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, updateNoteSchema);
  if (!check.success) return check.response;
  const n = check.data;
  return callWorkFunction(req, 'update_note', {
    target_note_id: id,
    note_title: n.title ?? null,
    note_body: n.body ?? null,
    target_project_id: n.projectId ?? null,
    clear_project: n.projectId === null,
    note_pinned: n.pinned ?? null,
  }, 200, toNote);
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  return callWorkFunction(req, 'delete_note', { target_note_id: id });
}
