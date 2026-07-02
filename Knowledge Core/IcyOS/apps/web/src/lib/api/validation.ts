import { NextRequest } from 'next/server';
import { z } from 'zod';
import { errorResponse } from './response';

export async function validatePayload<T>(
  req: NextRequest,
  schema: z.Schema<T>
): Promise<{ success: true; data: T } | { success: false; response: any }> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return {
        success: false,
        response: errorResponse('validation_error', 'Invalid payload parameters', parsed.error.format(), 400),
      };
    }
    return { success: true, data: parsed.data };
  } catch (err) {
    return {
      success: false,
      response: errorResponse('validation_error', 'Failed to parse JSON payload body', null, 400),
    };
  }
}
