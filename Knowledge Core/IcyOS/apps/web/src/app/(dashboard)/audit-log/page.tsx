'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, AlertTriangle, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Backdrop, CornerBrackets, PageHeader, SectionLabel, TacButton, useCountUp, GOLD, GREEN } from '../../../components/dashboard/hud';
import { apiFetch } from '../../../lib/api/client';

const AMBER = '#fbbf24';
const RED = '#f87171';
const CYAN = '#22d3ee';
const pad = (n: number) => String(n).padStart(2, '0');

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

type CategoryFilter = 'all' | 'auth' | 'data' | 'config' | 'system' | 'ai';

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'auth', label: 'AUTH' },
  { key: 'data', label: 'DATA' },
  { key: 'config', label: 'CONFIG' },
  { key: 'system', label: 'SYSTEM' },
  { key: 'ai', label: 'AI' },
];

const CATEGORY_COLOR: Record<AuditEvent['category'], string> = {
  auth: GOLD,
  data: CYAN,
  config: '#a78bfa',
  system: '#8a8d9a',
  ai: '#f472b6',
};

const STATUS = {
  success: { Icon: CheckCircle, color: GREEN, label: 'OK' },
  warning: { Icon: AlertTriangle, color: AMBER, label: 'WARN' },
  error: { Icon: XCircle, color: RED, label: 'ERR' },
};

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
        border: '1px solid #1e2030',
        boxShadow: '0 0 0 1px rgba(201,168,76,0.05), 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(201,168,76,0.08)',
      }}
    >
      <CornerBrackets color="rgba(201,168,76,0.55)" size={18} />
      <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)' }} />
      {children}
    </div>
  );
}

function Stat({ label, value, numeric, unit, color = '#e0dcd2' }: { label: string; value?: string; numeric?: number; unit?: string; color?: string }) {
  const counted = useCountUp(numeric ?? 0);
  return (
    <div className="relative flex flex-col gap-1.5 px-4 py-3.5 rounded-lg overflow-hidden" style={{ background: 'linear-gradient(160deg, #0f1017 0%, #0a0b10 100%)', border: '1px solid #1e2030' }}>
      <CornerBrackets color="rgba(201,168,76,0.3)" size={10} />
      <span className="font-tactical text-[8px] tracking-[0.2em] text-[#4a4d5a]">{label}</span>
      <span className="font-tactical text-[26px] leading-none font-semibold tabular-nums" style={{ color, textShadow: color === GOLD ? '0 0 18px rgba(201,168,76,0.3)' : 'none' }}>
        {numeric != null ? counted : value}
        {unit && <span className="text-[11px] text-[#4a4d5a] ml-1">{unit}</span>}
      </span>
    </div>
  );
}

const stamp = (iso: string) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase(),
    time: d.toLocaleTimeString('en-GB', { hour12: false }),
  };
};

export default function AuditLogPage() {
  const [snapshot, setSnapshot] = useState<AuditLogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  const load = useCallback(async () => {
    const res = await apiFetch<AuditLogSnapshot>('/api/audit-log');
    if (res.success && res.data) {
      setSnapshot(res.data);
      setError(null);
    } else {
      setError(res.error?.message ?? 'Could not load audit log');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredEvents = snapshot
    ? selectedCategory === 'all' ? snapshot.events : snapshot.events.filter((e) => e.category === selectedCategory)
    : [];
  const successCount = snapshot?.events.filter((e) => e.status === 'success').length ?? 0;
  const successRate = snapshot && snapshot.events.length > 0 ? Math.round((successCount / snapshot.events.length) * 100) : 0;
  const errorCount = snapshot?.events.filter((e) => e.status === 'error').length ?? 0;
  const countFor = (c: CategoryFilter) => (snapshot ? (c === 'all' ? snapshot.events.length : snapshot.events.filter((e) => e.category === c).length) : 0);

  return (
    <div className="relative flex flex-col gap-5 max-w-4xl">
      <Backdrop />

      <PageHeader
        eyebrow="LEDGER"
        title="Audit Log"
        aside={snapshot && <span className="font-tactical text-[10px] tracking-[0.2em] text-[#2f3240] hidden sm:block">{snapshot.totalCount} EVENTS · {snapshot.retentionDays}D RETENTION</span>}
      />
      <p className="text-sm text-[#8a8d9a] -mt-2">Track system activity and security events.</p>

      {loading && <span className="font-tactical text-[10px] tracking-[0.3em] text-[#4a4d5a]">// READING LEDGER</span>}

      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </span>
          <TacButton variant="ghost" onClick={() => { setLoading(true); void load(); }}>
            <RefreshCw size={12} /> RETRY
          </TacButton>
        </div>
      )}

      {snapshot && (
        <>
          <SectionLabel>SUMMARY</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label="TOTAL EVENTS" numeric={snapshot.totalCount} color={GOLD} />
            <Stat label="SUCCESS RATE" numeric={successRate} unit="%" color={successRate >= 95 ? GREEN : successRate >= 80 ? AMBER : RED} />
            <Stat label="ERRORS" numeric={errorCount} color={errorCount > 0 ? RED : '#4a4d5a'} />
            <Stat label="RETENTION" numeric={snapshot.retentionDays} unit="D" color="#8a8d9a" />
          </div>

          <SectionLabel>EVENTS · {pad(filteredEvents.length)}</SectionLabel>
          <Panel>
            <div className="flex items-center gap-1 px-4 pt-3 pb-3 border-b border-[#1e2030] overflow-x-auto">
              {CATEGORIES.map((c) => {
                const on = c.key === selectedCategory;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedCategory(c.key)}
                    className="font-tactical shrink-0 px-2.5 py-1.5 rounded-[4px] text-[10px] tracking-[0.14em] font-semibold flex items-center gap-1.5 transition-all min-h-[32px]"
                    style={{ color: on ? '#c9a84c' : '#6b6e7a', background: on ? 'rgba(201,168,76,0.10)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.3)' : 'none' }}
                  >
                    {c.key !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLOR[c.key] }} />}
                    {c.label}
                    <span className={`tabular-nums ${on ? 'text-[#c9a84c]/60' : 'text-[#2a2d3a]'}`}>{countFor(c.key)}</span>
                  </button>
                );
              })}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="flex items-center justify-center py-12 font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a]">NO EVENTS IN THIS CATEGORY</div>
            ) : (
              <ul className="flex flex-col">
                {filteredEvents.map((event, i) => {
                  const s = STATUS[event.status];
                  const t = stamp(event.timestamp);
                  const cc = CATEGORY_COLOR[event.category];
                  return (
                    <li key={event.id} className={`relative flex gap-4 px-5 py-3.5 ${i > 0 ? 'border-t border-[#1e2030]/60' : ''} ${event.status === 'error' ? 'bg-red-500/[0.03]' : ''}`}>
                      <span aria-hidden className="absolute left-0 top-3 bottom-3 w-px" style={{ background: s.color, opacity: event.status === 'success' ? 0.35 : 0.8 }} />
                      <div className="flex flex-col items-end font-tactical tabular-nums shrink-0 w-14">
                        <span className="text-[11px] text-[#b8b4ac]">{t.time}</span>
                        <span className="text-[9px] text-[#4a4d5a]">{t.date}</span>
                      </div>
                      <s.Icon size={15} className="shrink-0 mt-0.5" style={{ color: s.color }} />
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold text-[#e0dcd2]">{event.action}</span>
                          <span className="font-tactical text-[9px] tracking-[0.14em] px-1.5 py-[2px] rounded-[3px]" style={{ color: cc, background: `${cc}14`, boxShadow: `inset 0 0 0 1px ${cc}44` }}>{event.category.toUpperCase()}</span>
                          <span className="font-tactical text-[9px] tracking-[0.14em]" style={{ color: s.color }}>{s.label}</span>
                        </div>
                        <span className="font-tactical text-[10px] tracking-[0.08em] text-[#4a4d5a] flex flex-wrap gap-x-3">
                          <span>ACTOR <span className="text-[#8a8d9a]">{event.actor}</span></span>
                          <span>TARGET <span className="text-[#8a8d9a]">{event.target}</span></span>
                        </span>
                        <p className="text-[13px] text-[#8a8d9a] leading-snug">{event.details}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-[#1e2030] font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a]">
              <span className="flex items-center gap-2"><Download size={11} /> EXPORT {snapshot.exportFormats.map((f) => f.toUpperCase()).join(' · ')}</span>
              <span>{snapshot.totalCount} RECORDED · {snapshot.retentionDays}D RETENTION</span>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
