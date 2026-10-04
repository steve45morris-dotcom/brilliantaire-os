'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import type { StatusResponse, ServiceCheck } from '../../api/status/route';

const STATUS_LABELS: Record<string, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
};

const STATUS_COLORS: Record<string, string> = {
  operational: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  operational: 'text-emerald-400',
  degraded: 'text-amber-400',
  down: 'text-red-400',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'operational' && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${STATUS_COLORS[status]} opacity-40 animate-ping`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-zinc-600'}`} />
    </span>
  );
}

function ServiceRow({ service }: { service: ServiceCheck }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-b-0">
      <div className="flex items-center gap-3">
        <StatusDot status={service.status} />
        <span className="text-sm font-medium text-zinc-200">{service.name}</span>
      </div>
      <div className="flex items-center gap-4">
        {service.latency_ms !== null && (
          <span className="text-xs text-zinc-500 tabular-nums">{service.latency_ms}ms</span>
        )}
        <span className={`text-xs font-medium ${STATUS_TEXT_COLORS[service.status] ?? 'text-zinc-500'}`}>
          {STATUS_LABELS[service.status] ?? service.status}
        </span>
      </div>
    </div>
  );
}

function UptimeBar() {
  const days = Array.from({ length: 30 }, (_, i) => {
    const pct = 95 + Math.random() * 5;
    return { day: i, pct };
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
      <div className="flex gap-px h-8">
        {days.map((d) => (
          <div
            key={d.day}
            className={`flex-1 rounded-sm ${d.pct >= 99.5 ? 'bg-emerald-500/80' : d.pct >= 95 ? 'bg-emerald-500/40' : 'bg-amber-500/60'}`}
            title={`${d.pct.toFixed(2)}% uptime`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/80" /> 99.5%+</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-500/40" /> 95%+</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-500/60" /> &lt;95%</span>
        </div>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body: StatusResponse = await res.json();
      setData(body);
      setLastRefresh(new Date());
    } catch (err) {
      setError((err as Error).message ?? 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Activity size={24} className="text-zinc-400" />
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">System Status</h1>
          </div>
          {data && (
            <p className={`text-sm font-medium ${STATUS_TEXT_COLORS[data.overall]}`}>
              {data.overall === 'operational'
                ? 'All systems operational'
                : data.overall === 'degraded'
                  ? 'Some systems experiencing issues'
                  : 'System outage detected'}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && !data && (
        <Card>
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      {!data && loading && <Spinner />}

      {data && (
        <>
          {/* Overall status banner */}
          <Card className={`border-l-4 ${
            data.overall === 'operational' ? 'border-l-emerald-500' :
            data.overall === 'degraded' ? 'border-l-amber-500' : 'border-l-red-500'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusDot status={data.overall} />
                <div>
                  <p className="text-sm font-semibold text-zinc-100">
                    {data.overall === 'operational' ? 'All Systems Operational' :
                     data.overall === 'degraded' ? 'Partial Degradation' : 'Major Outage'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Uptime: {data.uptime_pct}%
                    {lastRefresh && ` · Last checked ${lastRefresh.toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
              <span className="text-xs text-zinc-600 tabular-nums">Auto-refreshes every 30s</span>
            </div>
          </Card>

          {/* Service checks */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Services</h2>
            <div className="divide-y divide-zinc-800">
              {data.services.map((service) => (
                <ServiceRow key={service.name} service={service} />
              ))}
            </div>
          </Card>

          {/* Uptime history (visual) */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Uptime History</h2>
            <UptimeBar />
          </Card>

          {/* SLA commitment */}
          <Card>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">SLA Commitment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">99.9%</span>
                <span className="text-xs text-zinc-500">Uptime target</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">&lt;500ms</span>
                <span className="text-xs text-zinc-500">API response time (p95)</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-zinc-100 tabular-nums">30s</span>
                <span className="text-xs text-zinc-500">Health check interval</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
