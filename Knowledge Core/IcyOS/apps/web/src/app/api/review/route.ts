import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../lib/api/response';
import { validatePayload } from '../../../lib/api/validation';
import { asCaller, badQuery, queryOf } from '../../../lib/day/route-helpers';
import { computeInsights } from '../../../lib/day/planner';
import { loadDayStats, loadPlan, loadReview, loadSessionsSince } from '../../../lib/day/server';
import { dateSchema, reviewSchema, windowSchema, type ReviewDay } from '../../../lib/day/types';
import { callWorkFunction } from '../../../lib/workspace/manage';

// GET ?date=YYYY-MM-DD&start=…&end=… (the user's local day): what got done,
// the saved reflection, and what recent focus sessions say about estimates.
export async function GET(req: Request) {
  const q = queryOf(req);
  const date = dateSchema.safeParse(q.date);
  const window = windowSchema.safeParse({ start: q.start, end: q.end });
  if (!date.success || !window.success) return badQuery('Pass ?date=YYYY-MM-DD&start=<ISO>&end=<ISO> for your day');
  return asCaller(req, 'your day', async ({ db }) => {
    const plan = await loadPlan(db, date.data);
    const [stats, review, sessions] = await Promise.all([
      loadDayStats(db, window.data, plan),
      loadReview(db, date.data),
      loadSessionsSince(db, new Date(Date.now() - 14 * 86_400_000).toISOString()),
    ]);
    const day: ReviewDay = { stats, review, insights: computeInsights(sessions) };
    return jsonResponse(day);
  });
}

// Saves (or updates) the day's reflection through save_review().
export async function POST(req: NextRequest) {
  const check = await validatePayload(req, reviewSchema);
  if (!check.success) return check.response;
  const r = check.data;
  return callWorkFunction(req, 'save_review', {
    review_date: r.date,
    score: r.score,
    went_well: r.wentWell || null,
    got_in_way: r.gotInWay || null,
    next_time: r.nextTime || null,
  });
}
