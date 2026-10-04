import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { toSession } from '../../../../lib/day/server';
import { focusActionSchema } from '../../../../lib/day/types';
import { callWorkFunction, notFound, routeId } from '../../../../lib/workspace/manage';

// Pauses, resumes or finishes a focus session: { action: "pause" | "resume" | "finish", outcome? }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, focusActionSchema);
  if (!check.success) return check.response;
  const a = check.data;
  if (a.action === 'finish') return callWorkFunction(req, 'finish_focus', { target_session_id: id, outcome: a.outcome }, 200, toSession);
  return callWorkFunction(req, a.action === 'pause' ? 'pause_focus' : 'resume_focus', { target_session_id: id }, 200, toSession);
}
