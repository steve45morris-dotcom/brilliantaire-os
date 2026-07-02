
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { SessionService } from '@icyos/services';
import { SessionRepository } from '@icyos/database';
import { z } from 'zod';

const sessionService = new SessionService(new SessionRepository());
const schema = z.object({
  workspaceId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await sessionService.startSession(check.data.workspaceId);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
