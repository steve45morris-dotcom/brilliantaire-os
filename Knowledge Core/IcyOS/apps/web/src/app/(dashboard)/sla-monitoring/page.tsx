'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { apiFetch } from '../../../lib/api/client';

interface ServiceCheck {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: string;
  uptime30d: number;
}

interface Incident {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface SlaSnapshot {
  overallStatus: 'operational' | 'degraded' | 'outage';
  timestamp: string;
  services: ServiceCheck[];
  incidents: Incident[];
  uptimeSummary: { last24h: number; last7d: number; last30d: number };
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'operational':
      return <CheckCircle size={18} className="text-emerald-400" />;
    case 'degraded':
      return <AlertTriangle size={18} className="text-amber-400" />;
    case 'down':
    case 'outage':
      return <XCircle size={18} className="text-red-400" />;
    default:
      return <Activity size={18} className="text-zinc-400" />;
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'operational': return 'text-emerald-300';
    case 'degraded': return 'text-amber-200';
    case 'down':
    case 'outage': return 'text-red-400';
    default: return 'text-zinc-400';
  }
}

function uptimeColor(uptime: number): string {
  if (uptime >= 99.9) return 'text-emerald-300';
  if (uptime >= 99.0) return 'text-amber-200';
  return 'text-red-400';
}

function formatUptime(value: number): string {
  return value.toFixed(3) + '%';
}

export default function SlaMonitoringPage() {
  const [snapshot, setSnapshot] = useState<SlaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<SlaSnapshot>('/api/sla');
    if (res.success && res.data) {
      setSnapshot(res.data);
      setError(null);
    } else {
      setError(res.error?.message ?? 'Could not load SLA data');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    void load();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner />
        <p className="text-sm text-zinc-500">Loading SLA monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SLA Monitoring</h1>
        <Card>
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="secondary" onClick={handleRefresh} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  if (!snapshot) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SLA Monitoring</h1>
          <p className="text-zinc-500 text-sm">Service health, uptime tracking, and incident history</p>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          <span className="ml-2">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Overall Status Banner */}
      <Card>
        <div className="flex items-center gap-4">
          <StatusIcon status={snapshot.overallStatus} />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">System Status</h2>
            <p className={`text-sm font-medium capitalize ${statusColor(snapshot.overallStatus)}`}>
              {snapshot.overallStatus === 'operational'
                ? 'All Systems Operational'
                : snapshot.overallStatus === 'degraded'
                  ? 'Partial System Degradation'
                  : 'System Outage Detected'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
            <Clock size={14} />
            <span>Last checked: {new Date(snapshot.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </Card>

      {/* Uptime Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Last 24 Hours', value: snapshot.uptimeSummary.last24h },
          { label: 'Last 7 Days', value: snapshot.uptimeSummary.last7d },
          { label: 'Last 30 Days', value: snapshot.uptimeSummary.last30d },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">{item.label}</p>
            <p className={`text-2xl font-bold mt-1 ${uptimeColor(item.value)}`}>
              {formatUptime(item.value)}
            </p>
          </Card>
        ))}
      </div>

      {/* Service Status Table */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">
          Service Health
        </h3>
        <div className="space-y-3">
          {snapshot.services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={service.status} />
                <span className="text-sm text-zinc-200">{service.name}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-xs text-zinc-500 w-20 text-right">
                  {service.latencyMs}ms
                </span>
                <span className={`text-xs w-20 text-right ${uptimeColor(service.uptime30d)}`}>
                  {formatUptime(service.uptime30d)}
                </span>
                <span className={`text-xs capitalize w-24 text-right ${statusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Incidents */}
      <Card>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4">
          Recent Incidents
        </h3>
        {snapshot.incidents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CheckCircle size={16} className="text-emerald-400" />
            <span>No incidents reported in the last 30 days</span>
          </div>
        ) : (
          <div className="space-y-3">
            {snapshot.incidents.map((incident) => (
              <div key={incident.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-sm text-zinc-200">{incident.title}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(incident.createdAt).toLocaleDateString()}
                    {incident.resolvedAt && ` — Resolved ${new Date(incident.resolvedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <span className={`text-xs capitalize ${incident.resolvedAt ? 'text-emerald-300' : 'text-amber-200'}`}>
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
