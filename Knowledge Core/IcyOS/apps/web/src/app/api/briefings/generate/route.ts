
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { ExecutiveBriefingService } from '@icyos/services';
import { z } from 'zod';

const briefingService = new ExecutiveBriefingService();
const schema = z.object({
  userId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await briefingService.generateExecutiveBriefing(check.data.userId);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
