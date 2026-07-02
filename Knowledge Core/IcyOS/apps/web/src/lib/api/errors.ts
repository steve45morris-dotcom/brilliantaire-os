import { errorResponse } from './response';
import { NextResponse } from 'next/server';

export function handleApiError(error: any): NextResponse {
  if (error && error.name === 'ServiceError') {
    return errorResponse(error.code || 'internal_error', error.message, null, 400);
  }
  return errorResponse('internal_error', 'An unexpected error occurred', null, 500);
}
