import { z } from 'zod';
import { NextResponse } from 'next/server';
import { jsonResponse, errorResponse } from '../api/response';
import { authenticateRequest } from '../auth/request-auth';

// Creating, renaming, reprioritising and deleting projects, missions and steps.
// Every change goes through a database function from
// supabase/migrations/22_manage_work.sql, which checks ownership itself; these
// helpers validate input, call it as the caller and map its errors.

const name = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);

export const priority = z.enum(['P1', 'P2', 'P3']);

export const createProjectSchema = z.object({
  name: name('Project name'),
  priority: priority.default('P2'),
});

export const updateProjectSchema = z
  .object({ name: name('Project name').optional(), priority: priority.optional() })
  .refine((v) => v.name !== undefined || v.priority !== undefined, { message: 'Nothing to change' });

export const createMissionSchema = z.object({
  name: name('Mission name'),
  steps: z.array(name('Step', 512)).max(50, 'A mission can have at most 50 steps').default([]),
});

export const renameMissionSchema = z.object({ name: name('Mission name') });

export const stepSchema = z.object({ text: name('Step', 512) });

export const idSchema = z.string().uuid();

/** Route params for /[id] routes; a malformed id is answered like a missing row. */
export async function routeId(params: Promise<{ id: string }>): Promise<string | null> {
  const { id } = await params;
  return idSchema.safeParse(id).success ? id : null;
}

export const notFound = () => errorResponse('not_found', 'Not found', null, 404);

/**
 * Calls one of the 22_manage_work.sql functions as the caller (browser session
 * or personal access token).
 * Its own messages for bad input (22023) and missing rows (P0002) are safe to
 * show; anything else is logged and hidden.
 */
export async function callWorkFunction(
  req: Request,
  fn: string,
  args: Record<string, unknown>,
  successStatus = 200,
  /** Reshapes the function's result for the client. */
  map: (data: unknown) => unknown = (data) => data
): Promise<NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.db.rpc(fn, args);
  if (error) {
    if (error.code === '22023') return errorResponse('validation_error', error.message, null, 400);
    if (error.code === 'P0002') return notFound();
    if (error.code === '42501') return errorResponse('unauthorized', 'Sign in required', null, 401);
    console.error(`${fn} failed:`, error.message);
    return errorResponse('internal_error', 'Could not save your change. Please try again.', null, 500);
  }
  return jsonResponse(map(data), successStatus);
}
