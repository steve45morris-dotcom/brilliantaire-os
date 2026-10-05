'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Filter, Download, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';
import { apiFetch } from '../../../lib/api/client';

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

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'All',
  auth: 'Auth',
  data: 'Data',
  config: 'Config',
  system: 'System',
  ai: 'AI',
};

const statusIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const statusColors = {
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Spinner />
        <p className="text-sm text-zinc-500">Loading audit log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Audit Log</h1>
        <Card>
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="secondary" onClick={() => { setLoading(true); void load(); }} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  if (!snapshot) return null;

  const filteredEvents = selectedCategory === 'all'
    ? snapshot.events
    : snapshot.events.filter((e) => e.category === selectedCategory);

  const successCount = snapshot.events.filter((e) => e.status === 'success').length;
  const successRate = snapshot.totalCount > 0
    ? Math.round((successCount / snapshot.totalCount) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Audit Log</h1>
        <p className="text-zinc-500 text-sm">Track system activity and security events</p>
      </div>

      {/* Category Filter Row */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(categoryLabels) as CategoryFilter[]).map((cat) => {
          const isActive = cat === selectedCategory;
          return (
            <Button
              key={cat}
              variant={isActive ? 'primary' : 'secondary'}
              onClick={() => setSelectedCategory(cat)}
              className={isActive ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}
            >
              {cat === 'all' && <Filter size={16} />}
              <span className={cat === 'all' ? 'ml-2' : ''}>{categoryLabels[cat]}</span>
            </Button>
          );
        })}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-pink-500" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Total Events</p>
              <p className="text-2xl font-bold text-zinc-100">{snapshot.totalCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Success Rate</p>
              <p className="text-2xl font-bold text-zinc-100">{successRate}%</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-cyan-500" />
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">Retention Period</p>
              <p className="text-2xl font-bold text-zinc-100">{snapshot.retentionDays} days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const StatusIcon = statusIcons[event.status];
          return (
            <Card key={event.id}>
              <div className="flex items-start gap-4">
                <StatusIcon size={20} className={`mt-0.5 ${statusColors[event.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-200">{event.action}</p>
                    <span className="text-xs font-medium bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      {event.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">Actor: {event.actor}</span>
                    <span className="text-zinc-700">|</span>
                    <span className="text-xs text-zinc-500">Target: {event.target}</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">{event.details}</p>
                  <p className="text-xs text-zinc-600 mt-2">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <Card>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <Download size={14} className="text-zinc-500" />
            <span>Export formats: {snapshot.exportFormats.join(', ')}</span>
            <span className="text-zinc-700">|</span>
            <span>Retention: {snapshot.retentionDays} days</span>
          </div>
          <span className="text-zinc-600">{snapshot.totalCount} events recorded</span>
        </div>
      </Card>
    </div>
  );
}
