import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { addSchema } from '../../../../lib/inbox/types';
import { callWorkFunction } from '../../../../lib/workspace/manage';

// Adds the reviewed missions in one transaction (add_inbox_missions,
// supabase/migrations/24_inbox.sql): all of them, or none if one is invalid.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, addSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'add_inbox_missions', {
    items: check.data.missions.map((m) => ({
      project_id: m.projectId,
      name: m.name,
      steps: m.steps,
      estimated_minutes: m.estimatedMinutes,
    })),
  }, 201);
}
