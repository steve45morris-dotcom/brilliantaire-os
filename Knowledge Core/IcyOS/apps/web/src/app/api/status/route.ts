import { NextResponse } from 'next/server';

export interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency_ms: number | null;
  checked_at: string;
}

export interface StatusResponse {
  overall: 'operational' | 'degraded' | 'down';
  services: ServiceCheck[];
  uptime_pct: number;
  checked_at: string;
}

async function checkSupabase(): Promise<ServiceCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const name = 'Database';
  const checked_at = new Date().toISOString();

  if (!url || !key) {
    return { name, status: 'down', latency_ms: null, checked_at };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: key },
      signal: AbortSignal.timeout(5000),
    });
    const latency_ms = Date.now() - start;
    return {
      name,
      status: res.ok ? (latency_ms > 2000 ? 'degraded' : 'operational') : 'degraded',
      latency_ms,
      checked_at,
    };
  } catch {
    return { name, status: 'down', latency_ms: Date.now() - start, checked_at };
  }
}

async function checkAuth(): Promise<ServiceCheck> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const name = 'Authentication';
  const checked_at = new Date().toISOString();

  if (!url || !key) {
    return { name, status: 'down', latency_ms: null, checked_at };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(5000),
    });
    const latency_ms = Date.now() - start;
    return {
      name,
      status: res.ok ? (latency_ms > 2000 ? 'degraded' : 'operational') : 'degraded',
      latency_ms,
      checked_at,
    };
  } catch {
    return { name, status: 'down', latency_ms: Date.now() - start, checked_at };
  }
}

function checkApp(): ServiceCheck {
  return {
    name: 'Application',
    status: 'operational',
    latency_ms: 0,
    checked_at: new Date().toISOString(),
  };
}

function deriveOverall(services: ServiceCheck[]): 'operational' | 'degraded' | 'down' {
  if (services.some((s) => s.status === 'down')) return 'down';
  if (services.some((s) => s.status === 'degraded')) return 'degraded';
  return 'operational';
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const services = await Promise.all([
    Promise.resolve(checkApp()),
    checkSupabase(),
    checkAuth(),
  ]);

  const overall = deriveOverall(services);
  const uptime_pct = services.filter((s) => s.status === 'operational').length / services.length * 100;

  const body: StatusResponse = {
    overall,
    services,
    uptime_pct: Math.round(uptime_pct * 100) / 100,
    checked_at: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
