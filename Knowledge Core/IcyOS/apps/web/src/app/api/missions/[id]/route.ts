import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { callWorkFunction, notFound, renameMissionSchema, routeId } from '../../../../lib/workspace/manage';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, renameMissionSchema);
  if (!check.success) return check.response;
  return callWorkFunction('rename_mission', { target_mission_id: id, mission_name: check.data.name });
}

// Deletes a mission with its steps.
export async function DELETE(_req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  return callWorkFunction('delete_mission', { target_mission_id: id });
}
