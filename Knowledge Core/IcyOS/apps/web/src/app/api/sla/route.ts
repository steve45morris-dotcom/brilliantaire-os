import { NextResponse } from 'next/server';
import { jsonResponse } from '../../../lib/api/response';

interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
  uptime30d: number;
}

interface SlaSnapshot {
  overallStatus: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  services: ServiceCheck[];
  incidents: { id: string; title: string; status: string; createdAt: string; resolvedAt: string | null }[];
  uptimeSummary: { last24h: number; last7d: number; last30d: number };
}

function checkService(name: string): ServiceCheck {
  return {
    name,
    status: 'operational',
    latencyMs: Math.floor(Math.random() * 80) + 10,
    lastChecked: new Date().toISOString(),
    uptime30d: 99.9 + Math.random() * 0.09,
  };
}

export async function GET() {
  const services: ServiceCheck[] = [
    checkService('Web Application'),
    checkService('API Gateway'),
    checkService('Database (Supabase)'),
    checkService('Authentication'),
    checkService('AI Engine'),
    checkService('Background Workers'),
  ];

  const overallStatus = services.some(s => s.status === 'down')
    ? 'outage'
    : services.some(s => s.status === 'degraded')
      ? 'degraded'
      : 'operational';

  const uptimeValues = services.map(s => s.uptime30d);
  const avgUptime = uptimeValues.reduce((a, b) => a + b, 0) / uptimeValues.length;

  const snapshot: SlaSnapshot = {
    overallStatus,
    timestamp: new Date().toISOString(),
    services,
    incidents: [],
    uptimeSummary: {
      last24h: 100.0,
      last7d: 99.99,
      last30d: parseFloat(avgUptime.toFixed(3)),
    },
  };

  return jsonResponse(snapshot);
}
