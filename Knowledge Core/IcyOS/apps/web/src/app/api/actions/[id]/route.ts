import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { callWorkFunction, notFound, routeId, stepSchema } from '../../../../lib/workspace/manage';

type Context = { params: Promise<{ id: string }> };

// Mission steps are stored as actions; /api/actions/complete ticks them.
export async function PATCH(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, stepSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'rename_step', { target_action_id: id, step_text: check.data.text });
}

// Deletes a step. Returns the mission's new status.
export async function DELETE(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  return callWorkFunction(req, 'delete_step', { target_action_id: id });
}
