import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../../lib/api/validation';
import { callWorkFunction, notFound, routeId, stepSchema } from '../../../../../lib/workspace/manage';

// Adds a step to the end of a mission. Returns the mission's new status.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, stepSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'add_step', { target_mission_id: id, step_text: check.data.text }, 201);
}
