'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, Check, Copy, ExternalLink, KeyRound, LogOut, Mic, MicOff, Orbit, Plus, RefreshCw, Volume2, VolumeX, WifiOff } from 'lucide-react';
import { PjkReactor, type CoreState } from './core';
import { display, mono } from './fonts';
import p from './pjk.module.css';

// P.J.K. Reactor: the console for P.J.K. in Sentinel OS on the Commander's Mac, reached
// over Tailscale. Its own look (not IcyOS's): red-orange, snow white and acid yellow on
// an ember-black field around a full-screen plasma reactor (core.tsx), with voice in and
// out and real link telemetry.

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  at: number;
}

type ConnectionStatus = 'checking' | 'connected' | 'unreachable' | 'unconfigured' | 'signin';

const PJK_URL_KEY = 'pjk_url';
const VOICE_KEY = 'pjk_voice';
const SCENE_KEY = 'pjk_3d';
// The signed P.J.K. session, from signing in with the passcode: { url, token }. Sentinel OS
// hands it only to origins in SENTINEL_REMOTE_ORIGINS; it lasts 30 days, until the passcode
// changes, or until Sign out here. It opens P.J.K.'s API only, not Commander authority.
const TOKEN_KEY = 'pjk_token';
// The conversation lasts for this tab only: sessionStorage, so it is gone when the tab closes.
const SESSION_KEY = 'pjk_session';
const STATUS_TEXT: Record<ConnectionStatus, string> = { checking: 'Linking', connected: 'Linked', unreachable: 'No link', unconfigured: 'Offline', signin: 'Sign in' };
const SUGGESTIONS = ['What should I focus on next?', 'Summarise my day so far', 'What is waiting for my GO?'];

// The Web Speech API is not in TypeScript's DOM types yet; only what is used here.
interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function read(store: 'local' | 'session', key: string): string | null {
  try {
    return (store === 'local' ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function write(store: 'local' | 'session', key: string, value: string | null) {
  try {
    const s = store === 'local' ? localStorage : sessionStorage;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
  } catch {}
}

const clock = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function elapsed(ms: number) {
  const m = Math.floor(ms / 60_000);
  return m < 1 ? '<1 min' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Reveals a reply a few characters at a time; the full text is there for screen readers at once. */
function Reveal({ text: full, live }: { text: string; live: boolean }) {
  const [n, setN] = useState(live ? 0 : full.length);
  useEffect(() => {
    if (!live || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(full.length);
      return;
    }
    const step = Math.max(2, Math.ceil(full.length / 90));
    const t = setInterval(() => setN((x) => (x >= full.length ? (clearInterval(t), x) : x + step)), 16);
    return () => clearInterval(t);
  }, [full, live]);
  return (
    <>
      <span className="sr-only">{full}</span>
      <span aria-hidden>
        {full.slice(0, n)}
        {n < full.length && <span className={p.caret} />}
      </span>
    </>
  );
}

export function PjkChat() {
  const [pjkUrl, setPjkUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const token = useRef<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const [scene, setScene] = useState(true);
  const [canListen, setCanListen] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<Recognition | null>(null);
  const lastLive = useRef(-1);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token.current) h.Authorization = `Bearer ${token.current}`;
    return h;
  }, []);

  const forgetToken = useCallback(() => {
    token.current = null;
    write('local', TOKEN_KEY, null);
  }, []);

  const checkConnection = useCallback(async (url: string) => {
    if (!url) {
      setStatus('unconfigured');
      setLatency(null);
      return;
    }
    setStatus('checking');
    const t0 = performance.now();
    try {
      const res = await fetch(`${url}/api/pjk/echo`, { method: 'POST', headers: headers(), body: JSON.stringify({ ping: true }), signal: AbortSignal.timeout(5000) });
      setLatency(res.ok ? Math.round(performance.now() - t0) : null);
      // 401: reachable, but this browser isn't signed in (or its session expired or the passcode changed).
      if (res.status === 401) forgetToken();
      setStatus(res.ok ? 'connected' : res.status === 401 ? 'signin' : 'unreachable');
    } catch {
      setLatency(null);
      setStatus('unreachable');
    }
  }, [headers, forgetToken]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_PJK_URL || read('local', PJK_URL_KEY) || '';
    try {
      const saved = JSON.parse(read('local', TOKEN_KEY) ?? 'null') as { url?: string; token?: string } | null;
      if (saved?.url === url && typeof saved.token === 'string') token.current = saved.token;
    } catch {}
    setPjkUrl(url);
    setUrlInput(url);
    void checkConnection(url);
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    setCanListen(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
    setCanSpeak('speechSynthesis' in window);
    setVoiceOut(read('local', VOICE_KEY) === 'on');
    setScene(read('local', SCENE_KEY) !== 'off');
    try {
      const saved = JSON.parse(read('session', SESSION_KEY) ?? '[]') as ChatMessage[];
      if (Array.isArray(saved)) {
        setMessages(saved);
        lastLive.current = saved.length - 1; // already shown, so not revealed again
      }
    } catch {}
  }, [checkConnection]);

  useEffect(() => {
    write('session', SESSION_KEY, messages.length ? JSON.stringify(messages) : null);
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [sending, scrollToBottom]);

  // The session clock ticks once a minute; nothing else here polls.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

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

  async function saveUrl(e: React.FormEvent) {
    e.preventDefault();
    const typed = urlInput.trim().replace(/\/+$/, '');
    // "mac.tail1234.ts.net:3000" means http://; a relative address (the preview's ".") stays as it is.
    const url = typed && !/^[a-z][a-z0-9+.-]*:\/\//i.test(typed) && !/^[./]/.test(typed) ? `http://${typed}` : typed;
    setUrlInput(url);
    setSignInError(null);
    if (url !== pjkUrl) forgetToken();
    write('local', PJK_URL_KEY, url);
    setPjkUrl(url);
    if (url && passcode) {
      setSigningIn(true);
      try {
        const res = await fetch(`${url}/api/pjk/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode }), signal: AbortSignal.timeout(8000) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          setSignInError(data.error ?? 'P.J.K. refused the sign-in.');
          setSigningIn(false);
          return;
        }
        if (typeof data.token === 'string') {
          token.current = data.token;
          write('local', TOKEN_KEY, JSON.stringify({ url, token: data.token }));
        }
        setPasscode('');
      } catch {
        setSignInError("Couldn't reach P.J.K. to sign in. Check the address and that both devices are on Tailscale.");
        setSigningIn(false);
        return;
      }
      setSigningIn(false);
    }
    void checkConnection(url);
  }

  function signOut() {
    forgetToken();
    window.speechSynthesis?.cancel();
    setStatus('signin');
    setLatency(null);
  }

  function say(reply: string) {
    if (!voiceOut || !canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(reply);
    u.lang = 'en-GB';
    u.onstart = () => setSpeaking(true);
    u.onend = u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  const sendText = useCallback(
    async (raw: string) => {
      const textIn = raw.trim();
      if (!textIn || sending || !pjkUrl) return;
      const history = [...messages, { role: 'user' as const, text: textIn, at: Date.now() }];
      setMessages(history);
      setInput('');
      setSending(true);
      let reply: string;
      try {
        const res = await fetch(`${pjkUrl}/api/pjk/chat`, {
          method: 'POST',
          headers: headers(),
          // P.J.K. reads role and text; the timestamps stay in this tab.
          body: JSON.stringify({ history: history.map(({ role, text: t }) => ({ role, text: t })) }),
          signal: AbortSignal.timeout(60000),
        });
        if (res.status === 401) {
          forgetToken();
          setStatus('signin');
          setLatency(null);
          reply = 'Your P.J.K. sign-in has expired. Enter your passcode to sign in again.';
        } else {
          const data = await res.json();
          reply = data.ok !== false && data.text ? data.text : (data.reply ?? data.error ?? 'P.J.K. returned an unexpected response.');
        }
      } catch {
        reply = 'Could not reach P.J.K. Check your connection and try again.';
        setStatus('unreachable');
        setLatency(null);
      }
      lastLive.current = history.length;
      setMessages([...history, { role: 'assistant', text: reply, at: Date.now() }]);
      setSending(false);
      say(reply);
    },
    // say() reads voiceOut and canSpeak, which are in the list.
    [messages, sending, pjkUrl, voiceOut, canSpeak, headers, forgetToken],
  );

  // Back to the box once a reply lands; it is disabled while P.J.K. thinks, so it can't keep focus.
  useEffect(() => {
    if (!sending && messages.length) inputRef.current?.focus();
  }, [sending, messages.length]);

  function toggleListen() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    window.speechSynthesis?.cancel();
    const r = new Ctor();
    r.lang = 'en-GB';
    r.interimResults = true;
    r.continuous = false;
    let finalText = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    r.onend = () => {
      setListening(false);
      recognition.current = null;
      if (finalText.trim()) void sendText(finalText);
    };
    r.onerror = () => setListening(false);
    recognition.current = r;
    setListening(true);
    r.start();
  }

  function toggleVoiceOut() {
    const next = !voiceOut;
    setVoiceOut(next);
    write('local', VOICE_KEY, next ? 'on' : 'off');
    if (!next) window.speechSynthesis?.cancel();
  }

  function toggleScene() {
    const next = !scene;
    setScene(next);
    write('local', SCENE_KEY, next ? 'on' : 'off');
  }

  function newSession() {
    window.speechSynthesis?.cancel();
    setMessages([]);
    lastLive.current = -1;
    inputRef.current?.focus();
  }

  async function copy(i: number, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {}
  }

  // "/" jumps to the command line from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !el.closest('input,textarea,select')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const coreState: CoreState = status !== 'connected' ? 'offline' : listening ? 'listening' : sending ? 'thinking' : speaking ? 'speaking' : 'idle';
  const CORE: Record<CoreState, [string, string]> = {
    offline: [status === 'checking' ? 'LINKING' : status === 'signin' ? 'LOCKED' : 'STANDBY', status === 'checking' ? 'Looking for your Mac' : status === 'signin' ? 'Passcode needed' : 'No link to Sentinel OS'],
    idle: ['READY', 'Awaiting command'],
    listening: ['LISTENING', 'Speak your command'],
    thinking: ['THINKING', 'Routing through Sentinel OS'],
    speaking: ['SPEAKING', 'Reply incoming'],
  };
  const [coreLabel, coreHint] = CORE[coreState];
  const started = messages[0]?.at;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.text ?? '';
  const voiceText = !canListen && !canSpeak ? 'Unavailable' : voiceOut ? 'Replies aloud' : canListen ? 'Mic ready' : 'Off';
  const systems: [string, string, boolean?][] = [
    ['Link', status === 'connected' ? 'Tailscale' : STATUS_TEXT[status], status === 'connected'],
    ['Round trip', latency !== null ? `${latency} ms` : '—'],
    ['GO gate', 'Sentinel OS'],
    ['Messages', String(messages.length)],
    ['Session', started ? elapsed(now - started) : '—'],
    ['Voice', voiceText],
  ];

  return (
    <div className={`${p.root} ${display.variable} ${mono.variable}`}>
      <PjkReactor state={coreState} live={scene} />

      <header className={p.bar}>
        <Link href="/dashboard" className={p.back}>
          <ArrowLeft size={14} aria-hidden /> IcyOS
        </Link>
        <span className={p.mark}>P.J.K.</span>
        <span className={p.tag}>REACTOR</span>
        <button type="button" className={p.scene} aria-pressed={scene} onClick={toggleScene} title={scene ? 'Turn the 3D reactor off' : 'Turn the 3D reactor on'}>
          <Orbit size={15} aria-hidden /> 3D {scene ? 'on' : 'off'}
        </button>
        <span className={p.link} data-status={status} role="status">
          <i aria-hidden />
          {STATUS_TEXT[status].toUpperCase()}
          {latency !== null && <b>{latency} ms</b>}
        </span>
      </header>

      <aside className={`${p.side} ${p.left}`} aria-label="Systems">
        <h2 className={p.sideHead}>SYSTEMS</h2>
        <dl className={p.systems}>
          {systems.map(([k, v, ok]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd data-ok={ok || undefined}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className={p.gate}>P.J.K. decides; it never acts. Anything it proposes waits for your GO in Sentinel OS.</p>
      </aside>

      <aside className={`${p.side} ${p.right}`} aria-label="Core state">
        <h2 className={p.sideHead}>CORE</h2>
        <div className={p.state} data-state={coreState}>
          {coreLabel}
        </div>
        <div className={p.hint}>{coreHint}</div>
      </aside>

      <div className={p.dock}>
        <div className={p.chip} data-state={coreState} aria-hidden>
          {coreLabel}
        </div>

        {/* ── Setup ── */}
        {(status === 'unconfigured' || status === 'unreachable' || status === 'signin') && (
          <form onSubmit={saveUrl} className={p.panel} aria-label="Link to P.J.K.">
            <h1 className={p.title}>
              {status === 'signin' ? 'Sign in to ' : 'Link '}
              <span>P.J.K.</span>
            </h1>
            {status === 'signin' && !signInError && (
              <p className={p.note} role="status">
                <KeyRound size={16} aria-hidden /> P.J.K. is reachable. Enter the passcode you set in Sentinel OS to sign this browser in for 30 days.
              </p>
            )}
            {signInError && (
              <p className={p.alert} role="alert">
                <KeyRound size={16} aria-hidden /> {signInError}
              </p>
            )}
            {status === 'unreachable' && (
              <p className={p.alert} role="alert">
                <WifiOff size={16} aria-hidden /> Can&apos;t reach P.J.K. Make sure Sentinel OS is running and both devices are on Tailscale.
              </p>
            )}
            <label className={p.label}>
              <span>P.J.K. address</span>
              <input type="text" inputMode="url" autoCapitalize="off" spellCheck={false} placeholder="http://100.x.x.x:3000 or https://mac.tail1234.ts.net" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className={p.input} />
            </label>
            <label className={p.label}>
              <span>Passcode{status === 'signin' ? '' : ' (if you have signed out or it is a new browser)'}</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="SENTINEL_REMOTE_PASSCODE"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required={status === 'signin'}
                className={p.input}
              />
            </label>
            <div className={p.row}>
              <button type="submit" className={p.primary} disabled={signingIn}>
                {signingIn ? 'Signing in…' : status === 'signin' ? 'Sign in' : 'Link'}
              </button>
              {pjkUrl && (
                <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer" className={p.ghost}>
                  Command Globe <ExternalLink size={14} aria-hidden />
                </a>
              )}
            </div>
            <p className={p.help}>
              On your Mac, set <code>SENTINEL_REMOTE=on</code> and <code>SENTINEL_REMOTE_PASSCODE</code> in <code>.env.local</code> in your Sentinel OS folder, add your IcyOS address to{' '}
              <code>SENTINEL_REMOTE_ORIGINS</code>, then install Tailscale on both devices. The passcode signs this browser in; it is sent only to your Mac.
            </p>
          </form>
        )}

        {status === 'checking' && <p className={p.linking}>Linking to P.J.K. on your Mac…</p>}

        {/* ── Conversation ── */}
        {status === 'connected' && (
          <section aria-label="Conversation with P.J.K." className={p.convo}>
            {messages.length === 0 ? (
              <div className={p.empty}>
                <h1 className={p.greet}>
                  Your command, <span>Commander.</span>
                </h1>
                <div className={p.suggest}>
                  {SUGGESTIONS.map((q) => (
                    <button key={q} type="button" onClick={() => void sendText(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div ref={scrollRef} className={p.log} aria-live="polite">
                {messages.map((m, i) => (
                  <div key={i} className={p.msg} data-role={m.role}>
                    <div className={p.meta}>
                      {m.role === 'user' ? 'YOU' : 'P.J.K.'} · {clock(m.at)}
                      {m.role === 'assistant' && (
                        <button type="button" className={p.copy} onClick={() => void copy(i, m.text)} aria-label="Copy reply">
                          {copied === i ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
                          {copied === i ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                    <div className={p.body}>{m.role === 'assistant' ? <Reveal text={m.text} live={i === lastLive.current} /> : m.text}</div>
                  </div>
                ))}
                {sending && (
                  <div className={`${p.msg} ${p.charging}`} data-role="assistant">
                    P.J.K. · CHARGING<span aria-hidden>…</span>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendText(input);
              }}
              className={p.cmd}
              data-listening={listening || undefined}
            >
              <span className={p.prompt} aria-hidden>
                &gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                aria-label="Message P.J.K."
                placeholder={listening ? 'Listening…' : 'Enter a command'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && !input && lastUser) {
                    e.preventDefault();
                    setInput(lastUser);
                  }
                  if (e.key === 'Escape') setInput('');
                }}
                disabled={sending}
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="on"
                className={p.cmdInput}
              />
              {canListen && (
                <button type="button" className={p.mic} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Speak a command'} onClick={toggleListen} disabled={sending}>
                  {listening ? <MicOff size={19} aria-hidden /> : <Mic size={19} aria-hidden />}
                </button>
              )}
              <button type="submit" aria-label="Send" disabled={!input.trim() || sending} className={p.send}>
                <ArrowUp size={19} aria-hidden />
              </button>
            </form>

            <div className={p.foot}>
              <span className={p.keys}>
                <kbd>/</kbd> focus · <kbd>↑</kbd> last command · <kbd>Esc</kbd> clear
              </span>
              <span className={p.footLinks}>
                {canSpeak && (
                  <button type="button" aria-pressed={voiceOut} onClick={toggleVoiceOut}>
                    {voiceOut ? <Volume2 size={13} aria-hidden /> : <VolumeX size={13} aria-hidden />} Voice {voiceOut ? 'on' : 'off'}
                  </button>
                )}
                <button type="button" onClick={newSession} disabled={!messages.length || sending}>
                  <Plus size={13} aria-hidden /> New session
                </button>
                <a href={`${pjkUrl}/command-globe`} target="_blank" rel="noopener noreferrer">
                  Command Globe <ExternalLink size={12} aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('unconfigured');
                    setLatency(null);
                    newSession();
                  }}
                >
                  Change address
                </button>
                <button type="button" onClick={() => void checkConnection(pjkUrl)}>
                  <RefreshCw size={12} aria-hidden /> Re-check
                </button>
                <button type="button" onClick={signOut}>
                  <LogOut size={12} aria-hidden /> Sign out
                </button>
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
