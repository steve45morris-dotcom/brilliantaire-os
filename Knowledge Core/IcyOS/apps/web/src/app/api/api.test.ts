import { describe, it, expect } from 'vitest';
import { GET as healthGET } from './health/route';
import { jsonResponse, errorResponse } from '../../lib/api/response';
import { handleApiError } from '../../lib/api/errors';
import { ServiceError } from '@icyos/services';

describe('Next.js API Routes Controllers & Boundaries', () => {
  it('should verify health route payload structure', async () => {
    const response = await healthGET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('should verify standard successful response envelopes formats', async () => {
    const data = { id: 123, status: 'Active' };
    const response = jsonResponse(data);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(data);
  });

  it('should verify standard validation error formatting', async () => {
    const response = errorResponse('validation_error', 'Invalid payload parameters', { email: 'invalid' }, 400);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
    expect(body.error.details.email).toBe('invalid');
  });

  it('should verify service error mapping conversion', async () => {
    const serviceError = new ServiceError('invariant_violation', 'Action bounds breached');
    const response = handleApiError(serviceError);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('invariant_violation');
  });
});
