"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState, useRef } from "react";
import { BarChart3, Bot, FileText, Home, Mic2, ShieldCheck, Siren, TimerReset, Circle, Terminal } from "lucide-react";
import { playClick } from "@/lib/sounds";

const nav = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/governance", label: "SENTINEL Governance", icon: ShieldCheck },
  { href: "/audits", label: "Audit Intelligence", icon: BarChart3 },
  { href: "/voice", label: "Voice Layer", icon: Mic2 },
  { href: "/agents", label: "Agents + Council", icon: Bot },
  { href: "/automation", label: "Automation", icon: TimerReset },
  { href: "/reports", label: "Reports", icon: FileText }
];

const mockLogsPool = [
  "[SYS] Daemon listener online on core port 8001",
  "[SYS] Mapped 37 active repositories for collision checks",
  "[MEM] Memory Vault DB connection established (26 tables)",
  "[SYS] Syncing voice engine profiles; speakSummary enabled",
  "[OK] Sentinel guardrails validated; arbitrary shell execution BLOCKED",
  "[SYS] Continuous monitoring loop: 0 active collisions found",
  "[SYS] Agent council synchronized: 4 nodes active",
  "[OK] Latest daily audit markdown compiled successfully",
  "[MEM] SQLite db state: healthy (1.7 MB, 26 tables)",
  "[SYS] Voice Layer events synchronized: profile 'Focus' mapped",
  "[OK] Space logger heartbeat received from Area Boy core",
  "[SYS] Integrity scan complete: all allowlists verified"
];

export function SystemShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const [logs, setLogs] = useState<string[]>([
    "[SYS] Starting Sentinel OS Daemon...",
    "[OK] System core loaded in 14.2ms",
    "[SYS] Monitoring loop active"
  ]);
  const consoleContainerRef = useRef<HTMLDivElement>(null);

  // Periodically push a random log to make the shell feel highly interactive
  useEffect(() => {
    const interval = setInterval(() => {
      const randomLog = mockLogsPool[Math.floor(Math.random() * mockLogsPool.length)];
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev.slice(-12), `[${timestamp}] ${randomLog}`]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <main className="command-grid min-h-screen relative">
      {/* 3D Cybernetic Mesh Grid Background Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-screen bg-[url('/images/mesh_grid.png')] bg-cover bg-center" 
        style={{ pointerEvents: 'none' }}
      />
      
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr] relative z-10">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="flex flex-col justify-between border-b border-cyan-300/10 bg-[#02050b]/80 p-5 backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div>
            {/* Header Brand */}
            <Link href="/" onClick={playClick} className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <Siren className="h-5 w-5 text-cyan-400 animate-pulse" />
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 cyber-pulse-cyan" />
              </div>
              <div>
                <div className="text-sm font-black tracking-wider text-white glow-text-cyan">SENTINEL OS</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Supernova Enterprise</div>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="mt-8 grid gap-1.5">
              {nav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={playClick}
                    className={`group relative flex min-h-11 items-center gap-3 rounded-md border px-3.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 ${
                      isActive
                        ? "border-cyan-400/30 bg-gradient-to-r from-cyan-950/40 to-cyan-900/10 text-cyan-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_12px_rgba(34,211,238,0.15)]"
                        : "border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-100"
                    }`}
                  >
                    {/* Active highlight dot */}
                    {isActive && (
                      <span className="absolute left-0 top-1/3 h-1/3 w-1 rounded-r-full bg-cyan-400" />
                    )}
                    <Icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Micro Daemon Monitor */}
            <div className="mt-8 rounded-lg border border-slate-800 bg-[#050b14]/50 p-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Live System Nodes</div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Circle className="h-1.5 w-1.5 fill-cyan-400 text-cyan-400 cyber-pulse-cyan" /> Core Daemon
                  </span>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/30 px-1.5 py-0.5 rounded">ONLINE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Circle className="h-1.5 w-1.5 fill-teal-400 text-teal-400" /> Collision Monitor
                  </span>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 border border-teal-800/30 px-1.5 py-0.5 rounded">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Circle className="h-1.5 w-1.5 fill-emerald-400 text-emerald-400" /> Memory Vault
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/30 px-1.5 py-0.5 rounded">SECURED</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR FOOTER: SCROLLING CONSOLE */}
          <div className="mt-8">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
              <Terminal className="h-3 w-3 text-cyan-400" />
              <span>Sentinel telemetry</span>
            </div>
            <div className="relative h-28 overflow-hidden rounded-lg border border-slate-800 bg-black/60 p-2 font-mono text-[9px] leading-relaxed text-cyan-400/90 shadow-inner">
              <div className="h-full overflow-y-auto space-y-1 pr-1" ref={consoleContainerRef}>
                {logs.map((log, index) => (
                  <div key={index} className="truncate select-none border-l border-cyan-500/20 pl-1">{log}</div>
                ))}
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN DISPLAY WORKSPACE */}
        <section className="flex flex-col min-w-0 min-h-screen">
          <header className="border-b border-cyan-300/10 bg-[#02050b]/60 backdrop-blur-md px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl glow-text-cyan">{title}</h1>
                <p className="mt-1 text-xs font-medium text-slate-400 uppercase tracking-wide">{subtitle ?? "The One System local command dashboard"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-extrabold tracking-wider uppercase">
                <span className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-yellow-400/90 shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                  Commander GO/STOP
                </span>
                <span className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-cyan-400/90 shadow-[0_0_10px_rgba(34,211,238,0.05)]">
                  Read-only APIs
                </span>
                <span className="rounded-md border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-teal-400/90 shadow-[0_0_10px_rgba(45,212,191,0.05)]">
                  Allowlisted Actions
                </span>
              </div>
            </div>
          </header>
          
          <div className="flex-1 p-6 lg:p-8 animate-fade-in">{children}</div>
        </section>
      </div>
    </main>
  );
}
