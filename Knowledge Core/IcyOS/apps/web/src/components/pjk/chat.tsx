'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, WifiOff, ExternalLink } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'unreachable' | 'unconfigured';

const PJK_URL_KEY = 'pjk_url';

function storedUrl(): string {
  try { return localStorage.getItem(PJK_URL_KEY) ?? ''; } catch { return ''; }
}

export function PjkChat() {
  const [pjkUrl, setPjkUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const checkConnection = useCallback(async (url: string) => {
    if (!url) { setStatus('unconfigured'); return; }
    setStatus('checking');
    try {
      const res = await fetch(`${url}/api/pjk/echo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ping: true }), signal: AbortSignal.timeout(5000) });
      setStatus(res.ok ? 'connected' : 'unreachable');
    } catch {
      setStatus('unreachable');
    }
  }, []);

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_PJK_URL ?? '';
    const saved = storedUrl();
    const url = envUrl || saved;
    setPjkUrl(url);
    setUrlInput(url);
    void checkConnection(url);
  }, [checkConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Keep input visible when iOS keyboard opens
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      scrollToBottom();
      inputRef.current?.scrollIntoView({ block: 'nearest' });
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, [scrollToBottom]);

  function saveUrl(e: React.FormEvent) {
    e.preventDefault();
    const url = urlInput.trim().replace(/\/+$/, '');
    try { localStorage.setItem(PJK_URL_KEY, url); } catch {}
    setPjkUrl(url);
    void checkConnection(url);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !pjkUrl) return;
    const userMsg: ChatMessage = { role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setSending(true);
    try {
      const res = await fetch(`${pjkUrl}/api/pjk/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      if (data.ok !== false && data.text) {
        setMessages([...history, { role: 'assistant', text: data.text }]);
      } else if (data.reply) {
        setMessages([...history, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages([...history, { role: 'assistant', text: data.error ?? 'P.J.K. returned an unexpected response.' }]);
      }
    } catch {
      setMessages([...history, { role: 'assistant', text: 'Could not reach P.J.K. Check your connection and try again.' }]);
      setStatus('unreachable');
    } finally {
      setSending(false);
    }
  }

  const statusColor = { checking: 'text-zinc-500', connected: 'text-emerald-400', unreachable: 'text-red-400', unconfigured: 'text-amber-400' };
  const statusLabel = { checking: 'Checking…', connected: 'Connected', unreachable: 'Unreachable', unconfigured: 'Not configured' };

  return (
    <div className="flex flex-col h-full max-w-2xl w-full">
      {/* Header — compact on mobile */}
      <div className="flex items-center gap-3 shrink-0 pb-3 md:pb-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-100">P.J.K.</h1>
        <span className={`text-xs font-semibold uppercase tracking-wide ${statusColor[status]}`}>
          {statusLabel[status]}
        </span>
      </div>

      {(status === 'unconfigured' || status === 'unreachable') && (
        <Card className="shrink-0">
          <form onSubmit={saveUrl} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              P.J.K. URL
              <input
                type="url"
                placeholder="http://100.x.x.x:3000 or https://mac.tail1234.ts.net"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-base text-zinc-100 focus:outline-none focus:border-pink-500"
              />
            </label>
            {status === 'unreachable' && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <WifiOff size={14} />
                <span>Can&apos;t reach P.J.K. Make sure Sentinel OS is running and both devices are on Tailscale.</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" className="self-start min-h-[44px]">Save &amp; Connect</Button>
              {pjkUrl && (
                <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline inline-flex items-center gap-1 min-h-[44px] px-2">
                  Open Command Globe <ExternalLink size={12} />
                </a>
              )}
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              On your Mac: set <code className="text-zinc-400">SENTINEL_REMOTE=on</code> and <code className="text-zinc-400">SENTINEL_REMOTE_PASSCODE</code> in <code className="text-zinc-400">~/sentinel-os/.env.local</code>, add your IcyOS URL to <code className="text-zinc-400">SENTINEL_REMOTE_ORIGINS</code>, then install Tailscale on both devices.
            </p>
          </form>
        </Card>
      )}

      {status === 'connected' && (
        <>
          {/* Messages — fills all available space, scrolls internally */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 -mx-1 px-1 overscroll-contain">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-600 text-sm">Send a message to P.J.K.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-pink-600 text-white rounded-br-md'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 bg-zinc-800 rounded-2xl rounded-bl-md">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input bar — pinned at bottom, safe-area aware */}
          <form onSubmit={send} className="flex gap-2 pt-3 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
            <input
              ref={inputRef}
              type="text"
              placeholder="Message P.J.K.…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              className="flex-1 min-w-0 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500 disabled:opacity-50"
            />
            <Button type="submit" disabled={!input.trim() || sending} className="px-3 min-w-[44px] min-h-[44px] rounded-xl shrink-0">
              <Send size={18} />
            </Button>
          </form>

          {/* Footer links — compact row */}
          <div className="flex items-center gap-3 text-xs text-zinc-600 pt-1 shrink-0">
            <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline inline-flex items-center gap-1 py-1">
              Command Globe <ExternalLink size={12} />
            </a>
            <button type="button" onClick={() => { setStatus('unconfigured'); setMessages([]); }} className="hover:text-zinc-400 transition-colors py-1">
              Change URL
            </button>
            <button type="button" onClick={() => void checkConnection(pjkUrl)} className="hover:text-zinc-400 transition-colors py-1">
              Re-check
            </button>
          </div>
        </>
      )}
    </div>
  );
}
