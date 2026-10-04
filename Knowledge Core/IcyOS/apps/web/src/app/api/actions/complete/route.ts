import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { authenticateRequest } from '../../../../lib/auth/request-auth';
import { setStepSchema, type SetStepResult } from '../../../../lib/workspace/overview';

// Ticks or un-ticks one mission step through set_action_completed()
// (supabase/migrations/21_mission_progress.sql), which also updates the
// mission's status.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, setStepSchema);
  if (!check.success) return check.response;

  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.db.rpc('set_action_completed', {
    action_id: check.data.actionId,
    completed: check.data.completed,
  });
  // Someone else's step and a missing one give the same answer.
  if (error?.code === 'P0002') return errorResponse('not_found', 'Step not found', null, 404);
  if (error || !data) {
    console.error('Updating step failed:', error?.message);
    return errorResponse('internal_error', 'Could not update the step', null, 500);
  }
  return jsonResponse(data as SetStepResult);
}
