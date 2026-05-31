"use client";

import { useState } from "react";
import { SentinelBlock } from "@/components/SentinelBlock";
import { ReplicatedLedger } from "@/components/ReplicatedLedger";
import { RefactorProposerPanel } from "@/components/RefactorProposerPanel";
import { OSInvokePanel } from "@/components/OSInvokePanel";
import { SovereigntyPanel } from "@/components/SovereigntyPanel";
import { SystemShell } from "@/components/SystemShell";
import { ShieldCheck, Database, Settings2, Lock, Coins } from "lucide-react";

export default function GovernancePage() {
  const [tab, setTab] = useState<"classifier" | "propose" | "ledger" | "invoke" | "sovereignty">("classifier");

  return (
    <SystemShell
      title="SENTINEL Governance"
      subtitle={
        tab === "classifier"
          ? "Classify actions and verify blast radius prior to execution."
          : tab === "propose"
          ? "Analyze codebase resource usage and propose optimization patches via consensus."
          : tab === "ledger"
          ? "View replicated state consensus transactions persisted across the mesh."
          : tab === "invoke"
          ? "Execute secure tasks dispatched from external operating systems and third-party AI agents."
          : "Compile micro-products, clear cross-chain bridge settlements, and execute ZK ledger audits."
      }
    >
      <div className="grid gap-6">
        {/* Toggle tabs */}
        <div className="flex border-b border-slate-850 pb-1 gap-2 flex-wrap">
          <button
            onClick={() => setTab("classifier")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "classifier"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Risk Classifier</span>
          </button>
          <button
            onClick={() => setTab("propose")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "propose"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Settings2 className="h-4 w-4" />
            <span>Refactor Proposer</span>
          </button>
          <button
            onClick={() => setTab("ledger")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "ledger"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Replicated Ledger</span>
          </button>
          <button
            onClick={() => setTab("invoke")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "invoke"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Lock className="h-4 w-4" />
            <span>Cross-OS Invoke</span>
          </button>
          <button
            onClick={() => setTab("sovereignty")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "sovereignty"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>Sovereignty Bridge</span>
          </button>
        </div>

        {tab === "classifier" && (
          <div className="animate-fade-in">
            <SentinelBlock initialAction="Read latest One System audit status" />
          </div>
        )}

        {tab === "propose" && (
          <div className="animate-fade-in">
            <RefactorProposerPanel />
          </div>
        )}

        {tab === "ledger" && (
          <div className="animate-fade-in">
            <ReplicatedLedger />
          </div>
        )}

        {tab === "invoke" && (
          <div className="animate-fade-in">
            <OSInvokePanel />
          </div>
        )}

        {tab === "sovereignty" && (
          <div className="animate-fade-in">
            <SovereigntyPanel />
          </div>
        )}
      </div>
    </SystemShell>
  );
}
