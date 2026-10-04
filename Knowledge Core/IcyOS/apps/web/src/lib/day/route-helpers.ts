import { NextResponse } from 'next/server';
import { errorResponse } from '../api/response';
import { authenticateRequest, type RequestAuth } from '../auth/request-auth';

/** Runs a read as the caller; a failed query is logged and answered with a generic 500. */
export async function asCaller(req: Request, what: string, run: (auth: RequestAuth) => Promise<NextResponse>): Promise<NextResponse> {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  try {
    return await run(auth);
  } catch (err) {
    console.error((err as Error).message);
    return errorResponse('internal_error', `Could not load ${what}`, null, 500);
  }
}

/** Query-string parameters as an object, for zod. */
export const queryOf = (req: Request) => Object.fromEntries(new URL(req.url).searchParams);

export const badQuery = (message: string) => errorResponse('validation_error', message, null, 400);
