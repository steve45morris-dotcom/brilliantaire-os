import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../../lib/api/validation';
import { callWorkFunction, createMissionSchema, notFound, routeId } from '../../../../../lib/workspace/manage';

// Adds a mission, with its steps in order, to a project.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await routeId(params);
  if (!id) return notFound();
  const check = await validatePayload(req, createMissionSchema);
  if (!check.success) return check.response;
  return callWorkFunction('create_mission', {
    target_project_id: id,
    mission_name: check.data.name,
    step_texts: check.data.steps,
  }, 201);
}
