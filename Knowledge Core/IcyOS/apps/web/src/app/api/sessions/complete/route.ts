
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { SessionService } from '@icyos/services';
import { z } from 'zod';

const sessionService = new SessionService();
const schema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().min(0).max(10)
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await sessionService.completeSession(check.data.sessionId, check.data.score);
    return jsonResponse({ success: result });
  } catch (err) {
    return handleApiError(err);
  }
}
