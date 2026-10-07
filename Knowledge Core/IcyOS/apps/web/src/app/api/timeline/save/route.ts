import { NextRequest } from 'next/server';
import { validatePayload } from '../../../../lib/api/validation';
import { saveSchema } from '../../../../lib/day/types';
import { callWorkFunction } from '../../../../lib/workspace/manage';

// Saves (or replaces) the plan for a day through save_day_plan()
// (supabase/migrations/25_day_planning.sql).
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, saveSchema);
  if (!check.success) return check.response;
  return callWorkFunction(req, 'save_day_plan', {
    plan_date: check.data.date,
    blocks: check.data.blocks.map((b) => ({ kind: b.kind, mission_id: b.missionId, title: b.title, start: b.start, end: b.end })),
  });
}
