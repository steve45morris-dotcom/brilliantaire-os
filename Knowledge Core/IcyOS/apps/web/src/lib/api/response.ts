import { NextResponse } from 'next/server';
import { ApiResponseEnvelope } from '@icyos/shared';

export function jsonResponse<T>(data: T, status = 200): NextResponse {
  const envelope: ApiResponseEnvelope<T> = {
    success: true,
    data,
    error: null,
    meta: {
      request_id: 'mock-request-id',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  return NextResponse.json(envelope, { status });
}

export function errorResponse(
  code: string,
  message: string,
  details?: any,
  status = 500
): NextResponse {
  const envelope: ApiResponseEnvelope<any> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    meta: {
      request_id: 'mock-request-id',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };
  return NextResponse.json(envelope, { status });
}
