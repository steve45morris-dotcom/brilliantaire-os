'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ExternalLink, RefreshCw, WifiOff } from 'lucide-react';
import { Words } from '../daylight/command-hero';
import s from '../daylight/daylight.module.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'unreachable' | 'unconfigured';

const PJK_URL_KEY = 'pjk_url';
const STATUS_TEXT: Record<ConnectionStatus, string> = {
  checking: 'Checking…',
  connected: 'Live',
  unreachable: 'Unreachable',
  unconfigured: 'Offline',
};
const SUGGESTIONS = ['What should I focus on next?', 'Summarise my day so far', 'What is waiting for my GO?'];

function storedUrl(): string {
  try {
    return localStorage.getItem(PJK_URL_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Chat with P.J.K. in Sentinel OS on the Commander's Mac, reached over Tailscale. */
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
    if (!url) {
      setStatus('unconfigured');
      return;
    }
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
    const url = envUrl || storedUrl();
    setPjkUrl(url);
    setUrlInput(url);
    void checkConnection(url);
  }, [checkConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

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
    try {
      localStorage.setItem(PJK_URL_KEY, url);
    } catch {}
    setPjkUrl(url);
    void checkConnection(url);
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || sending || !pjkUrl) return;
    const history = [...messages, { role: 'user' as const, text }];
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
      const reply = data.ok !== false && data.text ? data.text : (data.reply ?? data.error ?? 'P.J.K. returned an unexpected response.');
      setMessages([...history, { role: 'assistant', text: reply }]);
    } catch {
      setMessages([...history, { role: 'assistant', text: 'Could not reach P.J.K. Check your connection and try again.' }]);
      setStatus('unreachable');
    } finally {
      setSending(false);
    }
  }

  // Back to the box once a reply lands; it is disabled while P.J.K. thinks, so it can't keep focus.
  useEffect(() => {
    if (!sending && messages.length) inputRef.current?.focus();
  }, [sending, messages.length]);

  return (
    <>
      <section className={s.hero} aria-label="P.J.K.">
        <span className={s.floor} aria-hidden />
        <p className={s.pjStatus} data-status={status} role="status">
          <span className={s.pjDot} aria-hidden />
          P.J.K. · {STATUS_TEXT[status]}
          {status === 'connected' && <span className={s.pjVia}> · Sentinel OS via Tailscale</span>}
        </p>
        <h1 className={s.h1}>
          <Words text="P.J.K." delay={0.05} />
          <span className={s.h1em}>
            <Words text="At your command." delay={0.2} />
          </span>
        </h1>
        <p className={s.sub}>Talk to P.J.K. in Sentinel OS on your Mac. Anything it would do still waits for your GO there.</p>
      </section>

      <div className={s.page}>
        {/* ── Setup ── */}
        {(status === 'unconfigured' || status === 'unreachable') && (
          <form onSubmit={saveUrl} className={`${s.card} ${s.panel} ${s.rise}`} aria-label="Connect to P.J.K.">
            <div className={s.sec} style={{ marginTop: 0 }}>
              <span className={s.lab}>Connect to P.J.K.</span>
            </div>
            {status === 'unreachable' && (
              <p className={`${s.notice} ${s.noticeBad}`} role="alert" style={{ marginBottom: 14 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <WifiOff size={16} aria-hidden /> Can&apos;t reach P.J.K. Make sure Sentinel OS is running and both devices are on Tailscale.
                </span>
              </p>
            )}
            <label className={s.kbField}>
              <span className={s.kbLabel}>P.J.K. address</span>
              <input
                type="url"
                placeholder="http://100.x.x.x:3000 or https://mac.tail1234.ts.net"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className={s.field}
                style={{ width: '100%', flex: 'none' }}
              />
            </label>
            <div className={s.btnRow} style={{ marginTop: 14 }}>
              <button type="submit" className={`${s.btn} ${s.btnOx}`} data-snd="drum">
                Save and connect
              </button>
              {pjkUrl && (
                <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className={s.btn}>
                  Command Globe <ExternalLink size={14} aria-hidden />
                </a>
              )}
            </div>
            <p className={s.pjHelp}>
              On your Mac, set <code>SENTINEL_REMOTE=on</code> and <code>SENTINEL_REMOTE_PASSCODE</code> in <code>.env.local</code> in your Sentinel OS folder, add your IcyOS address to{' '}
              <code>SENTINEL_REMOTE_ORIGINS</code>, then install Tailscale on both devices.
            </p>
          </form>
        )}

        {status === 'checking' && <p className={s.nothing}>Looking for P.J.K. on your Mac…</p>}

        {/* ── Conversation ── */}
        {status === 'connected' && (
          <section className={`${s.card} ${s.cmd} ${s.pjDeck} ${s.rise}`} aria-label="Conversation with P.J.K.">
            <div ref={scrollRef} className={s.pjLog} aria-live="polite">
              {messages.length === 0 && (
                <div className={s.pjEmpty}>
                  <span className={`${s.orb} ${s.pjOrbBig}`} aria-hidden />
                  <p>Your command, Commander.</p>
                  <div className={s.pjSuggest}>
                    {SUGGESTIONS.map((q) => (
                      <button key={q} type="button" className={s.pjChip} onClick={() => void sendText(q)} data-snd="high">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={s.pjRow} data-role={msg.role}>
                  {msg.role === 'assistant' && (
                    <span className={s.pjAvatar} aria-hidden>
                      P
                    </span>
                  )}
                  <div className={s.pjBubble} data-role={msg.role}>
                    <span className="sr-only">{msg.role === 'user' ? 'You: ' : 'P.J.K.: '}</span>
                    {msg.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className={s.pjRow} data-role="assistant">
                  <span className={s.pjAvatar} aria-hidden>
                    P
                  </span>
                  <div className={`${s.pjBubble} ${s.pjTyping}`} data-role="assistant" aria-label="P.J.K. is thinking">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(input);
              }}
              className={s.pjDock}
            >
              <span className={`${s.orb} ${sending ? s.orbLive : ''}`} aria-hidden />
              <input
                ref={inputRef}
                type="text"
                aria-label="Message P.J.K."
                placeholder="Your command…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                className={s.pjInput}
              />
              <button type="submit" aria-label="Send" disabled={!input.trim() || sending} className={s.pjSend} data-snd="high">
                <ArrowUp size={18} aria-hidden />
              </button>
            </form>

            <div className={s.pjFoot}>
              <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer">
                Command Globe <ExternalLink size={12} aria-hidden />
              </a>
              <button
                type="button"
                onClick={() => {
                  setStatus('unconfigured');
                  setMessages([]);
                }}
              >
                Change address
              </button>
              <button type="button" onClick={() => void checkConnection(pjkUrl)}>
                <RefreshCw size={12} aria-hidden /> Re-check
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
