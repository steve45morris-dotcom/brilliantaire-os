"use client";

import { useState } from "react";
import { AgentCard } from "@/components/AgentCard";
import { RuntimeLoop } from "@/components/RuntimeLoop";
import { SystemShell } from "@/components/SystemShell";
import { MeshTopology } from "@/components/MeshTopology";
import { AstraScoutPanel } from "@/components/AstraScoutPanel";
import { EdgeLinkPanel } from "@/components/EdgeLinkPanel";
import { InfiniteNetworkPanel } from "@/components/InfiniteNetworkPanel";
import { Users, Globe, Compass, Network, Cpu } from "lucide-react";

const agents = [
  ["Commander", "Human final GO / STOP authority", "Human controlled", "commander"],
  ["Supernova", "Central orchestrator for The One System", "Mapped", "supernova"],
  ["SENTINEL", "Governance and blast-radius analysis", "Active", "sentinel"],
  ["Inner Council", "Specialized review and advisory layer", "Active Mesh consensus", "agent"],
  ["AI Pack", "Execution-capable agent set", "Dynamic Mesh routing", "agent"],
  ["Voice Layer", "Spoken digest and profile routing", "See live Voice page", "voice"]
] as const;

export default function AgentsPage() {
  const [tab, setTab] = useState<"roles" | "mesh" | "astra" | "edge" | "network">("roles");

  return (
    <SystemShell
      title="Agents & Council"
      subtitle={
        tab === "roles"
          ? "Operating roles and authority boundaries."
          : tab === "mesh"
          ? "Planetary node consensus and mesh topology tracker."
          : tab === "astra"
          ? "Active target market licensing opportunities and lead generation parsing."
          : tab === "edge"
          ? "Onboard mobile, desktop, and embedded IoT hardware clients directly into the compute mesh."
          : "Autonomous subagent synthesis, GPU multi-grid inference routing, and solar grid optimization."
      }
    >
      <div className="grid gap-6">
        
        {/* Toggle tabs */}
        <div className="flex border-b border-slate-850 pb-1 gap-2 flex-wrap">
          <button
            onClick={() => setTab("roles")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "roles"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Council Roles</span>
          </button>
          <button
            onClick={() => setTab("mesh")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "mesh"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Planetary Mesh Topology</span>
          </button>
          <button
            onClick={() => setTab("astra")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "astra"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>ASTRA Scout</span>
          </button>
          <button
            onClick={() => setTab("edge")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "edge"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Network className="h-4 w-4" />
            <span>Edge Link</span>
          </button>
          <button
            onClick={() => setTab("network")}
            className={`flex min-h-10 items-center gap-2 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              tab === "network"
                ? "border-cyan-400 text-cyan-200 glow-text-cyan font-black"
                : "border-transparent text-slate-500 hover:text-slate-300 font-bold"
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Infinite Network</span>
          </button>
        </div>

        {tab === "roles" && (
          <div className="grid gap-5 animate-fade-in">
            <RuntimeLoop />
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {agents.map(([name, role, state, type]) => (
                <AgentCard key={name} name={name} role={role} state={state} type={type} />
              ))}
            </div>
          </div>
        )}

        {tab === "mesh" && (
          <div className="animate-fade-in">
            <MeshTopology />
          </div>
        )}

        {tab === "astra" && (
          <div className="animate-fade-in">
            <AstraScoutPanel />
          </div>
        )}

        {tab === "edge" && (
          <div className="animate-fade-in">
            <EdgeLinkPanel />
          </div>
        )}

        {tab === "network" && (
          <div className="animate-fade-in">
            <InfiniteNetworkPanel />
          </div>
        )}

      </div>
    </SystemShell>
  );
}
