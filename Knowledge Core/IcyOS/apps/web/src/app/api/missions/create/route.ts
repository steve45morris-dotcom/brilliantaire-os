
import { NextRequest } from 'next/server';
import { jsonResponse } from '../../../../lib/api/response';
import { handleApiError } from '../../../../lib/api/errors';
import { validatePayload } from '../../../../lib/api/validation';
import { MissionService } from '@icyos/services';
import { z } from 'zod';

const missionService = new MissionService();
const schema = z.object({
  sprintId: z.string().uuid(),
  name: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const check = await validatePayload(req, schema);
    if (!check.success) return check.response;
    const result = await missionService.createMissionFromInput(check.data.sprintId, check.data.name);
    return jsonResponse(result);
  } catch (err) {
    return handleApiError(err);
  }
}
