import { jsonResponse } from '../../../lib/api/response';
import { asCaller, badQuery, queryOf } from '../../../lib/day/route-helpers';
import { loadPlan } from '../../../lib/day/server';
import { dateSchema } from '../../../lib/day/types';

// The plan saved for a day (?date=YYYY-MM-DD), or null.
export async function GET(req: Request) {
  const date = dateSchema.safeParse(queryOf(req).date);
  if (!date.success) return badQuery('Pass ?date=YYYY-MM-DD');
  return asCaller(req, 'the plan', async ({ db }) => jsonResponse({ plan: await loadPlan(db, date.data) }));
}
