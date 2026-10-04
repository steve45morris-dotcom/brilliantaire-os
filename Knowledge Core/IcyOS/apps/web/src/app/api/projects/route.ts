import { NextRequest } from 'next/server';
import { validatePayload } from '../../../lib/api/validation';
import { callWorkFunction, createProjectSchema } from '../../../lib/workspace/manage';

// Creates a project, with its "Sprint 1", in the signed-in user's workspace.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, createProjectSchema);
  if (!check.success) return check.response;
  return callWorkFunction('create_project', {
    project_name: check.data.name,
    project_priority: check.data.priority,
  }, 201);
}
