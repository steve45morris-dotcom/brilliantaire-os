
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { LearningService } from '@icyos/services';
import { z } from 'zod';

const learningService = new LearningService();
const schema = z.object({
  userId: z.string().uuid(),
  signal: z.any()
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await learningService.recordLearningSignal(check.data.userId, check.data.signal);
    return jsonResponse({ success: result });
  } catch (err) {
    return handleApiError(err);
  }
}
