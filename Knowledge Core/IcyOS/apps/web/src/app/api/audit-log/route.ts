import { jsonResponse } from '../../../lib/api/response';

interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'auth' | 'data' | 'config' | 'system' | 'ai';
  action: string;
  actor: string;
  target: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

interface AuditLogSnapshot {
  events: AuditEvent[];
  totalCount: number;
  retentionDays: number;
  exportFormats: string[];
}

export async function GET() {
  const snapshot: AuditLogSnapshot = {
    totalCount: 15,
    retentionDays: 90,
    exportFormats: ['CSV', 'JSON'],
    events: [
      {
        id: 'evt-001',
        timestamp: '2026-10-05T09:12:34Z',
        category: 'auth',
        action: 'User login',
        actor: 'admin@icyos.dev',
        target: 'auth/session',
        status: 'success',
        details: 'Successful login from 192.168.1.42 via dashboard.',
      },
      {
        id: 'evt-002',
        timestamp: '2026-10-05T08:45:11Z',
        category: 'ai',
        action: 'Generation request',
        actor: 'editor@icyos.dev',
        target: 'ai/generate',
        status: 'success',
        details: 'Text generation completed using claude-sonnet-4-20250514 in 2.3s.',
      },
      {
        id: 'evt-003',
        timestamp: '2026-10-04T22:30:00Z',
        category: 'system',
        action: 'Deployment completed',
        actor: 'ci-bot',
        target: 'vercel/production',
        status: 'success',
        details: 'Production deployment v1.4.2 rolled out successfully.',
      },
      {
        id: 'evt-004',
        timestamp: '2026-10-04T19:15:22Z',
        category: 'data',
        action: 'Record created',
        actor: 'admin@icyos.dev',
        target: 'knowledge/articles',
        status: 'success',
        details: 'New knowledge article "API Rate Limiting Guide" created.',
      },
      {
        id: 'evt-005',
        timestamp: '2026-10-04T17:08:45Z',
        category: 'config',
        action: 'API key rotated',
        actor: 'admin@icyos.dev',
        target: 'settings/api-keys',
        status: 'success',
        details: 'Production API key rotated. Previous key invalidated.',
      },
      {
        id: 'evt-006',
        timestamp: '2026-10-04T14:33:10Z',
        category: 'auth',
        action: 'MFA verification',
        actor: 'viewer@icyos.dev',
        target: 'auth/mfa',
        status: 'success',
        details: 'TOTP multi-factor authentication verified successfully.',
      },
      {
        id: 'evt-007',
        timestamp: '2026-10-04T11:20:55Z',
        category: 'ai',
        action: 'Rate limit hit',
        actor: 'editor@icyos.dev',
        target: 'ai/generate',
        status: 'warning',
        details: 'AI generation rate limit reached (10/min). Request queued.',
      },
      {
        id: 'evt-008',
        timestamp: '2026-10-03T23:45:30Z',
        category: 'system',
        action: 'Backup completed',
        actor: 'system',
        target: 'db/supernova',
        status: 'success',
        details: 'Nightly database backup completed. Size: 142MB, duration: 38s.',
      },
      {
        id: 'evt-009',
        timestamp: '2026-10-03T16:10:08Z',
        category: 'data',
        action: 'Record updated',
        actor: 'editor@icyos.dev',
        target: 'knowledge/articles/art-042',
        status: 'success',
        details: 'Article "Provider Configuration" updated with Gemini instructions.',
      },
      {
        id: 'evt-010',
        timestamp: '2026-10-03T10:55:42Z',
        category: 'auth',
        action: 'Login failed',
        actor: 'unknown@example.com',
        target: 'auth/session',
        status: 'error',
        details: 'Failed login attempt from 203.0.113.7. Invalid credentials.',
      },
      {
        id: 'evt-011',
        timestamp: '2026-10-02T20:30:15Z',
        category: 'config',
        action: 'Plan upgraded',
        actor: 'admin@icyos.dev',
        target: 'billing/subscription',
        status: 'success',
        details: 'Subscription upgraded from Starter to Pro tier.',
      },
      {
        id: 'evt-012',
        timestamp: '2026-10-02T15:22:38Z',
        category: 'data',
        action: 'Records exported',
        actor: 'admin@icyos.dev',
        target: 'knowledge/export',
        status: 'success',
        details: 'Exported 247 knowledge articles as JSON (3.8MB).',
      },
      {
        id: 'evt-013',
        timestamp: '2026-10-01T18:05:50Z',
        category: 'ai',
        action: 'Model switched',
        actor: 'admin@icyos.dev',
        target: 'ai/config',
        status: 'success',
        details: 'Default AI model changed from gpt-4o to claude-sonnet-4-20250514.',
      },
      {
        id: 'evt-014',
        timestamp: '2026-10-01T09:40:22Z',
        category: 'system',
        action: 'Cache cleared',
        actor: 'admin@icyos.dev',
        target: 'system/cache',
        status: 'warning',
        details: 'Full cache invalidation triggered. Temporary performance degradation expected.',
      },
      {
        id: 'evt-015',
        timestamp: '2026-09-30T14:18:33Z',
        category: 'auth',
        action: 'Session refresh',
        actor: 'editor@icyos.dev',
        target: 'auth/session',
        status: 'success',
        details: 'Session token refreshed. New expiry: 24 hours.',
      },
    ],
  };

  return jsonResponse(snapshot);
}
