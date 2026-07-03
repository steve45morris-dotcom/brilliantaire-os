
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { TimelineService } from '@icyos/services';
import { z } from 'zod';

const timelineService = new TimelineService();
const schema = z.object({
  timelineId: z.string().uuid(),
  reason: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await timelineService.regenerateTimeline(check.data.timelineId, check.data.reason);
    return jsonResponse({ success: result });
  } catch (err) {
    return handleApiError(err);
  }
}
