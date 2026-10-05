'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Calendar, Play, BarChart3, BookOpen, Settings, CreditCard, Activity, ClipboardList, Scale, Terminal,
  FolderKanban, Crosshair, Search, CornerDownLeft,
} from 'lucide-react';
import { apiFetch } from '../../lib/api/client';
import type { WorkspaceOverview } from '../../lib/workspace/overview';

export const PALETTE_EVENT = 'icyos:palette';
export const SELECT_PROJECT_EVENT = 'icyos:select-project';
export const openPalette = () => window.dispatchEvent(new CustomEvent(PALETTE_EVENT));

type Kind = 'page' | 'project' | 'mission';
interface Item {
  id: string;
  kind: Kind;
  title: string;
  hint: string;
  href: string;
  icon: typeof Play;
  keywords: string;
  color?: string;
}

const PAGES: Item[] = [
  { id: 'pg-dashboard', kind: 'page', title: 'Dashboard', hint: 'OPERATIONS CENTER', href: '/dashboard', icon: LayoutDashboard, keywords: 'ops home overview' },
  { id: 'pg-inbox', kind: 'page', title: 'Inbox', hint: 'INTAKE', href: '/inbox', icon: Inbox, keywords: 'dump capture sort' },
  { id: 'pg-timeline', kind: 'page', title: 'Timeline', hint: 'DAY PLAN', href: '/timeline', icon: Calendar, keywords: 'plan schedule day' },
  { id: 'pg-focus', kind: 'page', title: 'Focus', hint: 'FOCUS CHAMBER', href: '/focus', icon: Play, keywords: 'timer session pomodoro' },
  { id: 'pg-review', kind: 'page', title: 'Review', hint: 'DEBRIEF', href: '/review', icon: BarChart3, keywords: 'reflect score day' },
  { id: 'pg-knowledge', kind: 'page', title: 'Knowledge', hint: 'ARCHIVE', href: '/knowledge', icon: BookOpen, keywords: 'notes records' },
  { id: 'pg-pjk', kind: 'page', title: 'P.J.K.', hint: 'REMOTE TERMINAL', href: '/pjk', icon: Terminal, keywords: 'sentinel chat terminal' },
  { id: 'pg-status', kind: 'page', title: 'Status', hint: 'TELEMETRY', href: '/status', icon: Activity, keywords: 'health uptime services' },
  { id: 'pg-audit', kind: 'page', title: 'Audit Log', hint: 'LEDGER', href: '/audit-log', icon: ClipboardList, keywords: 'events security history' },
  { id: 'pg-billing', kind: 'page', title: 'Billing', hint: 'ACCOUNT', href: '/billing', icon: CreditCard, keywords: 'plan subscription stripe' },
  { id: 'pg-legal', kind: 'page', title: 'Legal', hint: 'GOVERNANCE', href: '/legal', icon: Scale, keywords: 'terms privacy policy' },
  { id: 'pg-settings', kind: 'page', title: 'Settings', hint: 'CONFIGURATION', href: '/settings', icon: Settings, keywords: 'config tokens api' },
];

const STATUS_COLOR: Record<string, string> = {
  Running: '#c9a84c', Approved: '#22d3ee', Staged: '#6b6e7a', Completed: '#34d399', Skipped: '#4a4d5a', Failed: '#ef4444',
};
const PRIORITY_COLOR: Record<string, string> = { P1: '#ef4444', P2: '#c9a84c', P3: '#6b6e7a' };
const KIND_LABEL: Record<Kind, string> = { page: 'PAGES', project: 'PROJECTS', mission: 'MISSIONS' };

/** Every query token must appear somewhere in the haystack; earlier title hits rank higher. */
function score(item: Item, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const title = item.title.toLowerCase();
  const hay = `${title} ${item.hint.toLowerCase()} ${item.keywords}`;
  let s = 0;
  for (const t of tokens) {
    const ti = title.indexOf(t);
    if (ti === 0) s += 30;
    else if (ti > 0) s += 15;
    else if (hay.includes(t)) s += 5;
    else return 0;
  }
  return s;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [workspace, setWorkspace] = useState<Item[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setCursor(0);
  }, []);

  // ⌘K / Ctrl+K toggles; the top bar fires PALETTE_EVENT.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  // Load projects and missions the first time the palette opens.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (workspace !== null) return;
    void apiFetch<WorkspaceOverview>('/api/workspace').then((res) => {
      if (!res.success || !res.data) {
        setWorkspace([]);
        return;
      }
      const items: Item[] = [];
      for (const p of res.data.projects) {
        items.push({ id: `pr-${p.id}`, kind: 'project', title: p.name, hint: `${p.priority} · ${p.missions.length} MISSIONS`, href: `/dashboard?project=${p.id}`, icon: FolderKanban, keywords: 'project', color: PRIORITY_COLOR[p.priority] });
        for (const m of p.missions) {
          if (['Completed', 'Skipped', 'Failed'].includes(m.status)) continue;
          items.push({ id: `mi-${m.id}`, kind: 'mission', title: m.name, hint: `${m.status.toUpperCase()} · ${p.name.toUpperCase()}`, href: `/focus?mission=${m.id}`, icon: Crosshair, keywords: `mission focus ${p.name.toLowerCase()}`, color: STATUS_COLOR[m.status] });
        }
      }
      setWorkspace(items);
    });
  }, [open, workspace]);

  const results = useMemo(() => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const pool = [...PAGES, ...(workspace ?? [])];
    const scored = pool.map((item) => ({ item, s: score(item, tokens) })).filter((r) => r.s > 0);
    scored.sort((a, b) => b.s - a.s);
    const limit = tokens.length ? 12 : 16;
    return scored.slice(0, limit).map((r) => r.item);
  }, [query, workspace]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const go = useCallback(
    (item: Item) => {
      close();
      router.push(item.href);
      // The dashboard stays mounted on an in-app push, so tell it directly too.
      if (item.kind === 'project') window.dispatchEvent(new CustomEvent(SELECT_PROJECT_EVENT, { detail: item.id.slice(3) }));
    },
    [close, router]
  );

  if (!open) return null;

  const grouped = results.reduce<{ kind: Kind; items: { item: Item; index: number }[] }[]>((acc, item, index) => {
    const last = acc[acc.length - 1];
    if (last && last.kind === item.kind) last.items.push({ item, index });
    else acc.push({ kind: item.kind, items: [{ item, index }] });
    return acc;
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ background: 'rgba(8,9,14,0.72)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="relative w-full max-w-xl rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #11121a 0%, #0b0c12 100%)',
          border: '1px solid rgba(201,168,76,0.35)',
          boxShadow: '0 0 0 1px rgba(201,168,76,0.08), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(201,168,76,0.08), inset 0 1px 0 rgba(201,168,76,0.15)',
        }}
      >
        <span aria-hidden className="absolute top-0 left-10 right-10 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.7), transparent)' }} />

        {/* Input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1e2030]">
          <Search size={15} className="text-[#c9a84c] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(results.length - 1, c + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); const it = results[cursor]; if (it) go(it); }
              else if (e.key === 'Escape') { e.preventDefault(); close(); }
            }}
            placeholder="Jump to a page, project or mission…"
            aria-label="Search commands"
            aria-activedescendant={results[cursor] ? `cmd-${results[cursor].id}` : undefined}
            className="flex-1 min-w-0 bg-transparent text-[15px] text-[#e0dcd2] placeholder:text-[#4a4d5a] focus:outline-none"
          />
          <span className="font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a] px-1.5 py-[2px] rounded-[3px] border border-[#1e2030]">ESC</span>
        </div>

        {/* Results */}
        <ul ref={listRef} role="listbox" className="max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-8 text-center font-tactical text-[10px] tracking-[0.16em] text-[#4a4d5a]">
              {workspace === null && query ? '// SCANNING' : 'NO MATCHES'}
            </li>
          )}
          {grouped.map((g) => (
            <li key={`${g.kind}-${g.items[0].index}`} className="pb-1">
              <div className="px-4 pt-2 pb-1 font-tactical text-[8px] tracking-[0.24em] text-[#4a4d5a]">{KIND_LABEL[g.kind]}</div>
              <ul>
                {g.items.map(({ item, index }) => {
                  const on = index === cursor;
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.id}
                      id={`cmd-${item.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={on}
                      onMouseEnter={() => setCursor(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(item)}
                      className="mx-2 flex items-center gap-3 px-3 h-11 rounded-md cursor-pointer transition-colors"
                      style={{ background: on ? 'rgba(201,168,76,0.09)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px rgba(201,168,76,0.3)' : 'none' }}
                    >
                      <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ color: item.color ?? (on ? '#c9a84c' : '#6b6e7a'), background: on ? 'rgba(201,168,76,0.08)' : 'rgba(30,32,48,0.5)' }}>
                        <Icon size={14} />
                      </span>
                      <span className="flex-1 min-w-0 flex flex-col">
                        <span className={`text-[14px] truncate ${on ? 'text-[#ece8de] font-semibold' : 'text-[#c8c4bc]'}`}>{item.title}</span>
                        <span className="font-tactical text-[9px] tracking-[0.12em] text-[#4a4d5a] truncate">{item.hint}</span>
                      </span>
                      {on && <CornerDownLeft size={12} className="text-[#c9a84c] shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 h-9 border-t border-[#1e2030] font-tactical text-[9px] tracking-[0.14em] text-[#4a4d5a]">
          <span className="flex items-center gap-3">
            <span><kbd className="text-[#8a8d9a]">↑↓</kbd> NAVIGATE</span>
            <span><kbd className="text-[#8a8d9a]">↵</kbd> OPEN</span>
          </span>
          <span>{workspace ? `${String(results.length).padStart(2, '0')} RESULTS` : 'LINKING WORKSPACE…'}</span>
        </div>
      </div>
    </div>
  );
}
