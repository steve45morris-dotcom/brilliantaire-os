
import { NextRequest } from 'next/server';
import { jsonResponse, errorResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { PlanningService } from '@icyos/services';

const planningService = new PlanningService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.input || typeof body.input !== 'string') {
      return errorResponse('validation_error', 'Input field is required and must be a string', null, 400);
    }
    const result = await planningService.captureInboxInput(body.input);
    return jsonResponse({ result });
  } catch (err) {
    return handleApiError(err);
  }
}
