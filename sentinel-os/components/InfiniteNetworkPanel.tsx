"use client";

import { useState, useEffect } from "react";
import { 
  Network, 
  Cpu, 
  BatteryCharging, 
  Plus, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from "lucide-react";

interface Subagent {
  id: string;
  name: string;
  role: string;
  status: "SPAWNING" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  cpuAllocated: number;
}

interface InferenceCluster {
  region: string;
  model: string;
  loadPct: number;
  tokensPerSec: number;
  status: "OPTIMAL" | "CONGESTED" | "ROUTING";
}

interface EnergyGrid {
  region: string;
  source: string;
  pricePerKwh: number;
  loadSharePct: number;
}

export function InfiniteNetworkPanel() {
  const [subagents, setSubagents] = useState<Subagent[]>([
    { id: "agent-x1", name: "Astrolux_Optimizer", role: "Model Weight Reconciliation", status: "RUNNING", progress: 65, cpuAllocated: 8 },
    { id: "agent-x2", name: "Sovereign_Broadcaster", role: "Transcript Audit Parser", status: "COMPLETED", progress: 100, cpuAllocated: 4 }
  ]);
  
  const [clusters, setClusters] = useState<InferenceCluster[]>([
    { region: "US-WEST (Oregon)", model: "DeepSeek-V3", loadPct: 78, tokensPerSec: 120, status: "OPTIMAL" },
    { region: "EU-CENTRAL (Frankfurt)", model: "Llama-3-70B", loadPct: 92, tokensPerSec: 45, status: "CONGESTED" },
    { region: "APAC-EAST (Tokyo)", model: "Qwen-2.5-Coder", loadPct: 40, tokensPerSec: 160, status: "OPTIMAL" }
  ]);

  const [grids, setGrids] = useState<EnergyGrid[]>([
    { region: "AP-SOUTH", source: "Excess Solar (Daytime)", pricePerKwh: 0.04, loadSharePct: 60 },
    { region: "US-EAST", source: "Hydroelectric", pricePerKwh: 0.11, loadSharePct: 30 },
    { region: "EU-WEST", source: "Wind (Offshore)", pricePerKwh: 0.22, loadSharePct: 10 }
  ]);

  // Form states for creating new dynamic subagent
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentRole, setNewAgentRole] = useState("VibeVoice Sync");
  const [newAgentCpu, setNewAgentCpu] = useState(4);
  const [spawning, setSpawning] = useState(false);

  const [routingLoading, setRoutingLoading] = useState(false);
  const [energyRoutingSuccess, setEnergyRoutingSuccess] = useState("");

  const handleSpawnSubagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) {
      alert("Please provide a name for the dynamic subagent");
      return;
    }
    setSpawning(true);
    
    setTimeout(() => {
      const newAgent: Subagent = {
        id: `agent-${Math.random().toString(36).substring(2, 7)}`,
        name: newAgentName.trim().replace(/ /g, "_"),
        role: newAgentRole,
        status: "RUNNING",
        progress: 10,
        cpuAllocated: Number(newAgentCpu)
      };
      
      setSubagents(prev => [newAgent, ...prev]);
      setNewAgentName("");
      setSpawning(false);
    }, 1200);
  };

  const handleOptimizeInference = () => {
    setRoutingLoading(true);
    setTimeout(() => {
      setClusters(prev => 
        prev.map(c => {
          if (c.region.includes("EU-CENTRAL")) {
            return { ...c, loadPct: 65, tokensPerSec: 85, status: "OPTIMAL" };
          }
          if (c.region.includes("APAC-EAST")) {
            return { ...c, loadPct: 67, tokensPerSec: 130, status: "OPTIMAL" };
          }
          return c;
        })
      );
      setRoutingLoading(false);
    }, 1500);
  };

  const handleOptimizeEnergy = () => {
    setEnergyRoutingSuccess("Dynamic load balance completed! Compute shifted 80% to Solar AP-SOUTH.");
    setGrids([
      { region: "AP-SOUTH", source: "Excess Solar (Daytime)", pricePerKwh: 0.04, loadSharePct: 80 },
      { region: "US-EAST", source: "Hydroelectric", pricePerKwh: 0.11, loadSharePct: 15 },
      { region: "EU-WEST", source: "Wind (Offshore)", pricePerKwh: 0.22, loadSharePct: 5 }
    ]);
  };

  // Simulate progress of running subagents
  useEffect(() => {
    const interval = setInterval(() => {
      setSubagents(prev => 
        prev.map(agent => {
          if (agent.status === "RUNNING") {
            const nextProgress = agent.progress + Math.floor(Math.random() * 15);
            if (nextProgress >= 100) {
              return { ...agent, progress: 100, status: "COMPLETED" };
            }
            return { ...agent, progress: nextProgress };
          }
          return agent;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-6">
      
      {/* 1. DYNAMIC SUBAGENT GENERATION */}
      <div className="glass-panel border border-cyan-500/30 bg-slate-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
        
        <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              Dynamic Subagent Generation (Task 1.2)
            </h3>
            <p className="text-xs text-slate-400 mt-1">ASTRA orchestrates micro-agents recursively to clear dedicated system workflows.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <form onSubmit={handleSpawnSubagent} className="border border-slate-850 bg-black/40 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">New Subagent Payload</span>
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Agent Unique Name</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Ledger_Auditor"
                  className="w-full h-9 px-3 bg-black border border-slate-800 rounded text-xs font-semibold text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Target Core Skill</label>
                <select
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  className="w-full h-9 px-2 bg-black border border-slate-800 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                >
                  <option value="VibeVoice Sync">VibeVoice Sync</option>
                  <option value="Model Calibration">Model Weight Calibration</option>
                  <option value="Risk Arbitrage Scoring">Risk Arbitrage Scoring</option>
                  <option value="On-Chain Ledger Settlement">On-Chain Ledger Settlement</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Threads Allocation (vCPUs)</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={newAgentCpu}
                  onChange={(e) => setNewAgentCpu(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-black border border-slate-800 rounded text-xs font-semibold text-white focus:outline-none focus:border-cyan-400/50 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={spawning}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 border border-cyan-500/40 text-cyan-300 rounded hover:bg-cyan-950/40 hover:border-cyan-300 transition text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              {spawning ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Spawn Micro-Agent</span>
                </>
              )}
            </button>
          </form>

          {/* Active Subagents Queue */}
          <div className="md:col-span-2 border border-slate-850 bg-black/40 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-3.5">Active Micro-Agents Execution Queue</span>
            <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
              {subagents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-extrabold select-all">{agent.name}</span>
                      <span className="text-[8px] font-bold text-slate-500 border border-slate-850 px-1 py-0.2 rounded bg-slate-950 font-mono">
                        {agent.cpuAllocated} THREADS
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{agent.role}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-24 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900 hidden sm:block">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${agent.progress}%` }} />
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase border tracking-wider ${
                      agent.status === "COMPLETED" 
                        ? "bg-teal-950/40 border-teal-900/30 text-teal-400"
                        : agent.status === "FAILED"
                        ? "bg-rose-950/40 border-rose-900/30 text-rose-400"
                        : "bg-cyan-950/40 border-cyan-900/30 text-cyan-400 animate-pulse"
                    }`}>
                      {agent.status === "COMPLETED" ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-teal-400" />
                      ) : agent.status === "FAILED" ? (
                        <AlertCircle className="h-2.5 w-2.5 text-rose-450" />
                      ) : (
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                      )}
                      <span>{agent.status} ({agent.progress}%)</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. INFERENCE CLUSTERS & ENERGY ROUTING GRID */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Multi-Grid Inference Routing */}
        <div className="border border-purple-500/30 bg-slate-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />
          
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                Multi-Grid Inference Routing (Task 1.1)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Route cognitive workloads across decentralized GPU clusters based on latency variance.</p>
            </div>
            
            <button
              onClick={handleOptimizeInference}
              disabled={routingLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-500/40 text-purple-300 rounded hover:bg-purple-950/40 hover:border-purple-300 transition text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${routingLoading ? "animate-spin" : ""}`} />
              <span>Optimize Load</span>
            </button>
          </div>

          <div className="space-y-3">
            {clusters.map((c, i) => {
              const isCongested = c.loadPct >= 90;
              return (
                <div key={i} className="p-3 border border-slate-900 bg-black/35 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase text-white tracking-wide">{c.region}</div>
                    <div className="text-[10px] font-semibold text-slate-450 uppercase">{c.model}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-mono text-xs font-black text-purple-300">{c.tokensPerSec} T/S</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        isCongested 
                          ? "bg-rose-950/45 border-rose-900/30 text-rose-400 animate-pulse" 
                          : "bg-purple-950/45 border-purple-900/30 text-purple-400"
                      }`}>
                        {isCongested ? "HIGH LOAD" : "OPTIMAL"}
                      </span>
                    </div>
                    {/* Load bar */}
                    <div className="w-28 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900 mt-1.5 ml-auto">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCongested ? "bg-rose-500" : "bg-purple-500"}`} 
                        style={{ width: `${c.loadPct}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Self-Sustaining Energy Routing */}
        <div className="border border-emerald-500/30 bg-slate-950/70 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
          
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <BatteryCharging className="h-4 w-4 text-emerald-450" />
                Sovereign Energy Grid Router (Task 1.3)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Direct inference queues dynamically to regions running on excess green energy.</p>
            </div>
            
            <button
              onClick={handleOptimizeEnergy}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/40 text-emerald-300 rounded hover:bg-emerald-950/40 hover:border-emerald-300 transition text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              <Play className="h-3 w-3 fill-emerald-400 text-emerald-400" />
              <span>Route Energy</span>
            </button>
          </div>

          {energyRoutingSuccess && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[10px] font-semibold text-emerald-400 glow-text-cyan mb-3">
              {energyRoutingSuccess}
            </div>
          )}

          <div className="space-y-3">
            {grids.map((g, i) => (
              <div key={i} className="p-3 border border-slate-900 bg-black/35 rounded-xl flex items-center justify-between text-xs font-semibold">
                <div className="space-y-1">
                  <div className="font-extrabold text-slate-200 uppercase tracking-wide">{g.region}</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">{g.source}</div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-mono text-[10px] text-slate-450">
                    Price: <strong className="text-slate-200">${g.pricePerKwh.toFixed(2)}</strong> / kWh
                  </div>
                  <div className="font-mono text-emerald-400 font-black">
                    {g.loadSharePct}% Core Load
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
    </div>
  );
}
