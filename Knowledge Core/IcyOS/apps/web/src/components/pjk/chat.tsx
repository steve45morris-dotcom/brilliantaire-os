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
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
    <div className="flex flex-col gap-6 max-w-2xl h-full">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">P.J.K.</h1>
          <span className={`text-xs font-semibold uppercase tracking-wide ${statusColor[status]}`}>
            {statusLabel[status]}
          </span>
        </div>
        <p className="text-zinc-500 text-sm">Voice-first command interface to your local Sentinel OS.</p>
      </div>

      {(status === 'unconfigured' || status === 'unreachable') && (
        <Card>
          <form onSubmit={saveUrl} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              P.J.K. URL
              <input
                type="url"
                placeholder="http://100.x.x.x:3000 or https://mac.tail1234.ts.net"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-pink-500"
              />
            </label>
            {status === 'unreachable' && (
              <div className="flex items-center gap-2 text-xs text-red-400">
                <WifiOff size={14} />
                <span>Can&apos;t reach P.J.K. Make sure Sentinel OS is running and both devices are on Tailscale.</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button type="submit" className="self-start">Save &amp; Connect</Button>
              {pjkUrl && (
                <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline inline-flex items-center gap-1">
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
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-[200px] max-h-[60vh]">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-600 text-sm">Send a message to P.J.K.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-pink-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-4 py-2.5 bg-zinc-800 rounded-lg rounded-bl-sm">
                  <Loader2 size={16} className="animate-spin text-zinc-400" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex gap-2">
            <input
              type="text"
              placeholder="Message P.J.K.…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              autoFocus
              className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500 disabled:opacity-50"
            />
            <Button type="submit" disabled={!input.trim() || sending} className="px-3">
              <Send size={16} />
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline inline-flex items-center gap-1">
              Open Command Globe <ExternalLink size={12} />
            </a>
            <button type="button" onClick={() => { setStatus('unconfigured'); setMessages([]); }} className="hover:text-zinc-400 transition-colors">
              Change URL
            </button>
            <button type="button" onClick={() => void checkConnection(pjkUrl)} className="hover:text-zinc-400 transition-colors">
              Re-check
            </button>
          </div>
        </>
      )}
    </div>
  );
}
