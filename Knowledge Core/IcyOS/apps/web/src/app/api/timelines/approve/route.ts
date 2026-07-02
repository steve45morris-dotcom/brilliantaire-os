
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { TimelineService } from '@icyos/services';
import { TimelineRepository } from '@icyos/database';
import { z } from 'zod';

const timelineService = new TimelineService(new TimelineRepository());
const schema = z.object({
  timelineId: z.string().uuid(),
  userId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await timelineService.approveTimeline(check.data.timelineId, check.data.userId);
    return jsonResponse({ success: result });
  } catch (err) {
    return handleApiError(err);
  }
}
