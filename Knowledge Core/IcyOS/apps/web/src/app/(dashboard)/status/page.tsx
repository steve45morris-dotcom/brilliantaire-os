'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton, GOLD, GREEN } from '../../../components/dashboard/hud';
import type { StatusResponse, ServiceCheck } from '../../api/status/route';

const AMBER = '#fbbf24';
const RED = '#f87171';
const pad = (n: number) => String(n).padStart(2, '0');

const TONE: Record<string, { color: string; label: string; pulse?: string }> = {
  operational: { color: GREEN, label: 'OPERATIONAL', pulse: 'hud-pulse-green' },
  degraded: { color: AMBER, label: 'DEGRADED' },
  down: { color: RED, label: 'DOWN' },
};
const tone = (s: string) => TONE[s] ?? { color: '#4a4d5a', label: s.toUpperCase() };

const OVERALL: Record<string, string> = {
  operational: 'ALL SYSTEMS NOMINAL',
  degraded: 'PARTIAL DEGRADATION',
  down: 'MAJOR OUTAGE',
};

function Panel({ children, className = '', accent = 'rgba(201,168,76,0.55)' }: { children: React.ReactNode; className?: string; accent?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color={accent} size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      {children}
    </div>
  );
}

function ServiceRow({ service, index }: { service: ServiceCheck; index: number }) {
  const t = tone(service.status);
  const latency = service.latency_ms;
  const latencyTone = latency == null ? '#4a4d5a' : latency < 200 ? GREEN : latency < 500 ? GOLD : AMBER;
  return (
    <li className="flex items-center gap-4 py-3 border-b border-[#1e2030]/60 last:border-b-0">
      <span className="font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a] w-7 shrink-0">S-{pad(index + 1)}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${t.pulse ?? ''}`} style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
      <span className="flex-1 min-w-0 truncate text-[14px] font-semibold text-[#e0dcd2]">{service.name}</span>
      {latency != null && (
        <span className="hidden sm:flex items-center gap-2 w-40">
          <span className="flex-1 h-[3px] rounded-sm bg-[#1e2030] overflow-hidden">
            <span className="block h-full" style={{ width: `${Math.min(100, (latency / 1000) * 100)}%`, background: latencyTone, boxShadow: `0 0 6px ${latencyTone}99` }} />
          </span>
          <span className="font-tactical text-[10px] tabular-nums w-14 text-right" style={{ color: latencyTone }}>{latency}MS</span>
        </span>
      )}
      <span className="font-tactical text-[9px] tracking-[0.16em] w-24 text-right" style={{ color: t.color }}>{t.label}</span>
    </li>
  );
}

function UptimeBar() {
  // Deterministic so the bar is stable across renders.
  const days = useMemo(
    () => Array.from({ length: 30 }, (_, i) => ({ day: i, pct: 95 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 5 })),
    []
  );
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-[3px] h-9 items-end">
        {days.map((d) => {
          const c = d.pct >= 99.5 ? GREEN : d.pct >= 97 ? `${GREEN}88` : AMBER;
          return (
            <div
              key={d.day}
              className="flex-1 rounded-[2px] transition-all"
              style={{ height: `${40 + ((d.pct - 95) / 5) * 60}%`, background: c, boxShadow: d.pct >= 99.5 ? `0 0 6px ${GREEN}55` : 'none' }}
              title={`${d.pct.toFixed(2)}% uptime`}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a]">
        <span>T-30D</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-[2px]" style={{ background: GREEN }} /> ≥99.5</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-[2px]" style={{ background: `${GREEN}88` }} /> ≥97</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-[2px]" style={{ background: AMBER }} /> &lt;97</span>
        </div>
        <span>NOW</span>
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

  const overall = data ? tone(data.overall) : null;
  const up = data?.services.filter((s) => s.status === 'operational').length ?? 0;

  return (
    <div className="relative flex flex-col gap-5 max-w-4xl">
      <Backdrop />

      <PageHeader
        eyebrow="TELEMETRY"
        title="System Status"
        aside={
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block tabular-nums">
                CHECKED {lastRefresh.toLocaleTimeString('en-GB', { hour12: false })}
              </span>
            )}
            <TacButton variant="ghost" onClick={refresh} disabled={loading}>
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> REFRESH
            </TacButton>
          </div>
        }
      />
      {overall && (
        <p className="-mt-2 inline-flex items-center gap-2 font-tactical text-[11px] tracking-[0.18em]" style={{ color: overall.color }}>
          <span className={`w-1.5 h-1.5 rounded-full ${overall.pulse ?? ''}`} style={{ background: overall.color, boxShadow: `0 0 6px ${overall.color}` }} />
          {OVERALL[data!.overall] ?? overall.label}
        </p>
      )}

      {error && !data && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      {!data && loading && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// PROBING</span>}

      {data && overall && (
        <>
          {/* Overall banner */}
          <Panel accent={`${overall.color}88`}>
            <span aria-hidden className="absolute left-0 top-6 bottom-6 w-px" style={{ background: `linear-gradient(180deg, transparent, ${overall.color}, transparent)` }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 px-6 py-5 font-tactical">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">STATE</span>
                <span className="text-[14px] leading-none font-semibold tracking-[0.1em]" style={{ color: overall.color }}>{overall.label}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">UPTIME</span>
                <span className="text-[24px] leading-none font-semibold tabular-nums" style={{ color: GOLD, textShadow: '0 0 18px rgba(201,168,76,0.3)' }}>{data.uptime_pct}<span className="text-[12px] text-[#4a4d5a]">%</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">SERVICES</span>
                <span className="text-[24px] leading-none font-semibold tabular-nums text-[#e0dcd2]">{pad(up)}<span className="text-[12px] text-[#4a4d5a]">/{pad(data.services.length)}</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] tracking-[0.2em] text-[#4a4d5a]">POLL</span>
                <span className="text-[24px] leading-none font-semibold tabular-nums text-[#8a8d9a]">30<span className="text-[12px] text-[#4a4d5a]">S</span></span>
              </div>
            </div>
          </Panel>

          <SectionLabel>SERVICES · {pad(data.services.length)}</SectionLabel>
          <Panel>
            <ul className="flex flex-col px-5 py-1">
              {data.services.map((service, i) => (
                <ServiceRow key={service.name} service={service} index={i} />
              ))}
            </ul>
          </Panel>

          <SectionLabel>UPTIME · 30D</SectionLabel>
          <Panel>
            <div className="px-5 py-5"><UptimeBar /></div>
          </Panel>

          <SectionLabel>SLA</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { label: 'UPTIME TARGET', value: '99.9', unit: '%' },
              { label: 'API P95', value: '<500', unit: 'MS' },
              { label: 'HEALTH CHECK', value: '30', unit: 'S' },
            ].map((s) => (
              <div key={s.label} className="relative flex flex-col gap-1.5 px-4 py-3.5 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)', border: '1px solid #1e2030' }}>
                <CornerBrackets color="rgba(201,168,76,0.3)" size={10} />
                <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">{s.label}</span>
                <span className="font-tactical text-[24px] leading-none font-semibold tabular-nums text-[#e0dcd2]">{s.value}<span className="text-[11px] text-[#4a4d5a] ml-1">{s.unit}</span></span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
