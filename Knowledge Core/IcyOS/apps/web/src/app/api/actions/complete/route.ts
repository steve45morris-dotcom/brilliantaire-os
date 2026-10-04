import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { createServerSupabaseClient } from '../../../../lib/auth/supabase-server';
import { setStepSchema, type SetStepResult } from '../../../../lib/workspace/overview';

// Ticks or un-ticks one mission step through set_action_completed()
// (supabase/migrations/21_mission_progress.sql), which also updates the
// mission's status.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, setStepSchema);
  if (!check.success) return check.response;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return errorResponse('unauthorized', 'Sign in required', null, 401);

  const { data, error } = await supabase.rpc('set_action_completed', {
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
