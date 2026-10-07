'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Loader2, WifiOff, ExternalLink } from 'lucide-react';

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

  const statusDot: Record<ConnectionStatus, string> = {
    checking: 'bg-[#4a4d5a]',
    connected: 'bg-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]',
    unreachable: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
    unconfigured: 'bg-[#4a4d5a]',
  };
  const statusText: Record<ConnectionStatus, string> = {
    checking: 'Checking…',
    connected: 'Live',
    unreachable: 'Unreachable',
    unconfigured: 'Offline',
  };

  return (
    <div className="flex flex-col h-full max-w-2xl w-full" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="shrink-0 pb-2 md:pb-3">
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl md:text-3xl font-bold tracking-[0.06em] text-[#c9a84c]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            P.J.K.
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/5">
            <span className={`w-[6px] h-[6px] rounded-full ${statusDot[status]}`} />
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#c9a84c]">
              {statusText[status]}
            </span>
          </div>
        </div>
        {status === 'connected' && (
          <p className="text-[11px] text-[#4a4d5a] font-light mt-0.5">Sentinel OS · via Tailscale</p>
        )}
      </div>

      {/* Setup form */}
      {(status === 'unconfigured' || status === 'unreachable') && (
        <div className="shrink-0 p-5 md:p-6 bg-[#12131a] border border-[#1e2030] rounded-xl">
          <form onSubmit={saveUrl} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#4a4d5a]">
                P.J.K. Endpoint
              </span>
              <input
                type="url"
                placeholder="http://100.x.x.x:3000 or https://mac.tail1234.ts.net"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="px-4 py-3 bg-[#0e0f16] border border-[#1e2030] rounded-xl text-base text-[#d0ccc4] placeholder:text-[#3a3c4a] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
              />
            </label>
            {status === 'unreachable' && (
              <div className="flex items-center gap-2 text-xs text-red-400/80">
                <WifiOff size={14} />
                <span>Can&apos;t reach P.J.K. Make sure Sentinel OS is running and both devices are on Tailscale.</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 min-h-[44px] rounded-xl font-semibold text-sm bg-[#c9a84c] text-[#080808] hover:brightness-110 transition-all disabled:opacity-50"
              >
                Save &amp; Connect
              </button>
              {pjkUrl && (
                <a
                  href={`${pjkUrl}/command-globe`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c9a84c]/60 hover:text-[#c9a84c] transition-colors inline-flex items-center gap-1 min-h-[44px] px-1"
                >
                  Command Globe <ExternalLink size={12} />
                </a>
              )}
            </div>
            <p className="text-xs text-[#4a4d5a] leading-relaxed">
              On your Mac: set <code className="text-[#b8b4ac]">SENTINEL_REMOTE=on</code> and{' '}
              <code className="text-[#b8b4ac]">SENTINEL_REMOTE_PASSCODE</code> in{' '}
              <code className="text-[#b8b4ac]">~/sentinel-os/.env.local</code>, add your IcyOS URL to{' '}
              <code className="text-[#b8b4ac]">SENTINEL_REMOTE_ORIGINS</code>, then install Tailscale on both devices.
            </p>
          </form>
        </div>
      )}

      {/* Connected: chat interface */}
      {status === 'connected' && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 -mx-1 px-1 overscroll-contain"
          >
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/15 flex items-center justify-center">
                  <span className="text-[#c9a84c] text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}>
                    P
                  </span>
                </div>
                <p className="text-[#4a4d5a] text-sm font-light">Your command, Commander.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div
                    className="max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed whitespace-pre-wrap font-medium text-[#080808]"
                    style={{ background: 'linear-gradient(135deg, #c9a84c, #a8872e)' }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed whitespace-pre-wrap bg-[#12131a] border border-[#1e2030] text-[#b8b4ac]">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-[#12131a] border border-[#1e2030] rounded-2xl rounded-bl-md">
                  <Loader2 size={16} className="animate-spin text-[#c9a84c]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            className="flex gap-2 pt-3 shrink-0 pb-[env(safe-area-inset-bottom,0px)] border-t border-[#14151e]"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Your command…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              className="flex-1 min-w-0 px-4 py-3 bg-[#0e0f16] border border-[#1e2030] rounded-xl text-base text-[#d0ccc4] placeholder:text-[#3a3c4a] focus:outline-none focus:border-[#c9a84c]/40 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-3 min-w-[44px] min-h-[44px] rounded-xl bg-[#c9a84c] disabled:opacity-30 hover:brightness-110 transition-all shrink-0 flex items-center justify-center"
            >
              <Send size={18} className="text-[#080808]" />
            </button>
          </form>

          {/* Footer */}
          <div className="flex items-center gap-4 text-[11px] text-[#4a4d5a] pt-2 shrink-0">
            <a
              href={`${pjkUrl}/command-globe`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors inline-flex items-center gap-1 py-1"
            >
              Command Globe <ExternalLink size={10} />
            </a>
            <button
              type="button"
              onClick={() => { setStatus('unconfigured'); setMessages([]); }}
              className="hover:text-[#b8b4ac] transition-colors py-1"
            >
              Change URL
            </button>
            <button
              type="button"
              onClick={() => void checkConnection(pjkUrl)}
              className="hover:text-[#b8b4ac] transition-colors py-1"
            >
              Re-check
            </button>
          </div>
        </>
      )}
    </div>
  );
}
