import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { toSession } from '../../../../lib/day/server';
import { startFocusSchema } from '../../../../lib/day/types';
import { callWorkFunction } from '../../../../lib/workspace/manage';

// Starts a focus session on a mission. One runs at a time; the server keeps the clock.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, startFocusSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'start_focus', {
    target_mission_id: check.data.missionId,
    planned_minutes: check.data.plannedMinutes,
  }, 201, toSession);
}
