import { jsonResponse } from '../../../lib/api/response';
import { asCaller, queryOf } from '../../../lib/day/route-helpers';
import { loadActiveSession, loadPlan, loadPlannerMissions } from '../../../lib/day/server';
import { dateSchema } from '../../../lib/day/types';

// The running focus session (if any), the missions that can be focused on,
// and, with ?date=, the next planned mission that day.
export async function GET(req: Request) {
  const date = dateSchema.safeParse(queryOf(req).date);
  return asCaller(req, 'your focus session', async ({ db }) => {
    const [active, missions, plan] = await Promise.all([
      loadActiveSession(db),
      loadPlannerMissions(db),
      date.success ? loadPlan(db, date.data) : Promise.resolve(null),
    ]);
    const open = missions.filter((m) => ['Staged', 'Approved', 'Running'].includes(m.status));
    const now = Date.now();
    const next = plan?.blocks.find((b) => b.kind === 'mission' && b.missionId && Date.parse(b.end) > now && open.some((m) => m.id === b.missionId));
    return jsonResponse({
      active,
      missions: open.map((m) => ({ id: m.id, name: m.name, projectName: m.projectName, estimatedMinutes: m.estimatedMinutes })),
      nextPlannedMissionId: next?.missionId ?? null,
    });
  });
}
