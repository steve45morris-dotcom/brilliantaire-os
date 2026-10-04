import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { callWorkFunction, notFound, routeId, updateProjectSchema } from '../../../../lib/workspace/manage';

type Context = { params: Promise<{ id: string }> };

// Renames and/or reprioritises a project.
export async function PATCH(req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, updateProjectSchema);
  if (!check.success) return check.response;
  return callWorkFunction('update_project', {
    target_project_id: id,
    project_name: check.data.name ?? null,
    project_priority: check.data.priority ?? null,
  });
}

// Deletes a project with all its missions and steps.
export async function DELETE(_req: NextRequest, { params }: Context) {
  const id = await routeId(params);
  if (!id) return notFound();
  return callWorkFunction('delete_project', { target_project_id: id });
}
