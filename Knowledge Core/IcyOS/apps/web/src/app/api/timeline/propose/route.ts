import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { validatePayload } from '../../../../lib/api/validation';
import { asCaller } from '../../../../lib/day/route-helpers';
import { computeInsights, planDay } from '../../../../lib/day/planner';
import { loadPlannerMissions, loadSessionsSince } from '../../../../lib/day/server';
import { proposeSchema } from '../../../../lib/day/types';

// Proposes a plan for a working window from the caller's open missions, with
// buffers sized from their recent focus sessions. Saves nothing.
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, proposeSchema);
  if (!check.success) return check.response;
  return asCaller(req, 'your missions', async ({ db }) => {
    const [missions, sessions] = await Promise.all([
      loadPlannerMissions(db),
      loadSessionsSince(db, new Date(Date.now() - 14 * 86_400_000).toISOString()),
    ]);
    return jsonResponse(planDay(missions, check.data, computeInsights(sessions)));
  });
}
