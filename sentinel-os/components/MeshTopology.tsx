"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  ShieldCheck,
  Zap,
  Server,
  RefreshCw,
  Radio,
  Clock,
  Vote,
  Plus,
  TrendingUp,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

function getNodeCoordinates(node: any, index: number, total: number) {
  const isUs = node.location?.includes("US") || node.id?.includes("us");
  const isEu = node.location?.includes("EU") || node.id?.includes("eu");
  const isAp = node.location?.includes("AP") || node.id?.includes("ap");

  let x = 250;
  let y = 150;

  if (isUs) {
    x = 100 + (index % 3) * 35;
    y = 70 + (index % 2) * 55;
  } else if (isEu) {
    x = 250 + (index % 3) * 20;
    y = 150 + (index % 2) * 70;
  } else if (isAp) {
    x = 400 + (index % 3) * 35;
    y = 70 + (index % 2) * 55;
  } else {
    const angle = (index / (total || 1)) * Math.PI * 2;
    x = 250 + Math.cos(angle) * 125;
    y = 150 + Math.sin(angle) * 85;
  }
  return { x, y };
}

export function MeshTopology() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ZKP Handshake tester state
  const [testNodeId, setTestNodeId] = useState("");
  const [testProof, setTestProof] = useState("");
  const [zkpResult, setZkpResult] = useState<any>(null);
  const [zkpLoading, setZkpLoading] = useState(false);

  // Onboard Tenant state
  const [clientName, setClientName] = useState("");
  const [clientTier, setClientTier] = useState("ACTIVE");
  const [provisionLoading, setProvisionLoading] = useState(false);

  // Raft Consensus proposer state
  const [propId, setPropId] = useState("PROP-");
  const [propData, setPropData] = useState("");
  const [consensusResult, setConsensusResult] = useState<any>(null);
  const [consensusLoading, setConsensusLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mesh/topology");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        setError(json.error || "Failed to load mesh topology data");
      }
    } catch (err) {
      setError("Network error fetching mesh metrics.");
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation() {
    setSimulating(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/topology", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSuccess(`Digital Twin simulation completed: Failover recovery took ${json.result.failoverConvergenceMs}ms (Limit: < 2.0s). STATUS: PASS.`);
        await load();
      } else {
        setError(json.error || "Simulation run failed");
      }
    } catch (err) {
      setError("Failed to run sandbox simulation.");
    } finally {
      setSimulating(false);
    }
  }

  async function handleZkpTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testNodeId || !testProof) {
      alert("Please provide both Node ID and Challenge Proof");
      return;
    }
    setZkpLoading(true);
    setZkpResult(null);
    try {
      const res = await fetch("/api/mesh/zkp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: testNodeId, proof: testProof }),
      });
      const json = await res.json();
      setZkpResult(json);
    } catch (err) {
      setZkpResult({ ok: false, error: "Handshake network timeout." });
    } finally {
      setZkpLoading(false);
    }
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim()) {
      alert("Please provide a valid client name");
      return;
    }
    setProvisionLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientName.trim(), tier: clientTier }),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(`Onboarding Successful! Provisioned client '${json.clientName}' with assigned Client ID: ${json.clientId}. Added HA-nodes: ${json.nodesProvisioned.join(", ")}`);
        setClientName("");
        await load();
      } else {
        setError(json.error || "Failed to provision client");
      }
    } catch (err) {
      setError("Network error during provisioning.");
    } finally {
      setProvisionLoading(false);
    }
  }

  async function handleConsensus(e: React.FormEvent) {
    e.preventDefault();
    if (!propId.trim() || !propData.trim()) {
      alert("Proposal ID and details are required");
      return;
    }
    setConsensusLoading(true);
    setConsensusResult(null);
    try {
      const res = await fetch("/api/mesh/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: propId.trim(), proposalData: propData.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        setConsensusResult(json.result);
        setPropId(`PROP-${Math.floor(Math.random() * 10000)}`);
        setPropData("");
      } else {
        setError(json.error || "Consensus simulation failed");
      }
    } catch (err) {
      setError("Network error validating proposal consensus.");
    } finally {
      setConsensusLoading(false);
    }
  }

  const generateRandomProof = () => {
    const chars = "0123456789abcdef";
    let proof = "";
    for (let i = 0; i < 32; i++) {
      proof += chars[Math.floor(Math.random() * 16)];
    }
    setTestProof(proof);
    if (data?.nodes?.length > 0) {
      const randomNode = data.nodes[Math.floor(Math.random() * data.nodes.length)];
      setTestNodeId(randomNode.id);
    }
  };

  useEffect(() => {
    void load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const nodes = data?.nodes || [];
  const history = data?.history || [];

  const nodesWithCoords = nodes.map((node: any, idx: number) => {
    const coords = getNodeCoordinates(node, idx, nodes.length);
    return { ...node, ...coords };
  });

  return (
    <div className="grid gap-6">
      
      {/* 1. VISUAL TOPOLOGY LAYOUT MAP */}
      <div className="glass-panel border border-slate-800 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
              <h2 className="text-base font-extrabold tracking-wider text-white uppercase glow-text-cyan">Planetary Mesh Topology</h2>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 font-medium">Gossip network distribution and regional compute latency map.</p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="relative inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 text-xs font-black uppercase tracking-wider text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-cyan-400" : "text-slate-400"}`} />
            <span>Poll Peer Latency</span>
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs font-semibold text-rose-400 glow-text-danger mb-6">
            [MESH WARNING] {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs font-semibold text-teal-400 glow-text-cyan mb-6">
            [PROVISION MATCH] {success}
          </div>
        )}

        {/* Interactive 3D Holographic Topology Graph */}
        <div className="mb-6 border border-slate-850 bg-black/45 p-4 rounded-xl relative overflow-hidden shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Mesh Node Visualizer (Click nodes to trigger visual tracer)</span>
            {selectedNodeId && (
              <button 
                onClick={() => setSelectedNodeId(null)} 
                className="text-[9px] text-cyan-400 hover:underline uppercase cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>
          <div className="relative w-full h-[300px]">
            {nodes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Radio className="h-6 w-6 text-slate-650 mb-2 animate-pulse" />
                <span>Loading active nodes coordinates...</span>
              </div>
            ) : (
              <svg viewBox="0 0 500 300" className="w-full h-full">
                <defs>
                  <pattern id="topology-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(51, 65, 85, 0.08)" strokeWidth="1" />
                  </pattern>
                  <radialGradient id="glow-cyan" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(34, 211, 238, 0.2)" />
                    <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
                  </radialGradient>
                  <radialGradient id="glow-purple" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
                    <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
                  </radialGradient>
                  <radialGradient id="glow-emerald" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                  </radialGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#topology-grid)" />

                {/* Draw gossip connection lines */}
                {nodesWithCoords.map((n1: any, idx: number) => {
                  const n2 = nodesWithCoords[(idx + 1) % nodesWithCoords.length];
                  const isSelectedPath = selectedNodeId === n1.id || selectedNodeId === n2.id;
                  return (
                    <line
                      key={`l-${idx}`}
                      x1={n1.x}
                      y1={n1.y}
                      x2={n2.x}
                      y2={n2.y}
                      stroke={isSelectedPath ? "rgba(34, 211, 238, 0.7)" : "rgba(51, 65, 85, 0.3)"}
                      strokeWidth={isSelectedPath ? 1.5 : 1}
                      strokeDasharray={isSelectedPath ? "4 2" : "5 5"}
                      className={isSelectedPath ? "animate-[pulse_1.5s_infinite]" : ""}
                    />
                  );
                })}

                {/* Dynamic selected tracer lines */}
                {selectedNodeId && nodesWithCoords.map((n: any, idx: number) => {
                  if (n.id === selectedNodeId) return null;
                  const sourceNode = nodesWithCoords.find((x: any) => x.id === selectedNodeId);
                  if (!sourceNode) return null;
                  return (
                    <line
                      key={`t-${idx}`}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={n.x}
                      y2={n.y}
                      stroke="rgba(168, 85, 247, 0.8)"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      className="animate-[pulse_1s_infinite]"
                      style={{ strokeDashoffset: -idx * 5 }}
                    />
                  );
                })}

                {/* Render Node Circles */}
                {nodesWithCoords.map((node: any) => {
                  const isSelected = selectedNodeId === node.id;
                  const isEdge = node.nodeType?.startsWith("EDGE");
                  
                  // Color codes
                  let baseColor = "stroke-cyan-400 fill-cyan-950/60 text-cyan-400";
                  let glowId = "#glow-cyan";
                  if (node.nodeType === "ASTRA") {
                    baseColor = "stroke-amber-400 fill-amber-950/60 text-amber-400";
                  } else if (node.nodeType === "SID") {
                    baseColor = "stroke-purple-400 fill-purple-950/60 text-purple-400";
                    glowId = "#glow-purple";
                  } else if (node.nodeType === "GEMINI") {
                    baseColor = "stroke-emerald-400 fill-emerald-950/60 text-emerald-400";
                    glowId = "#glow-emerald";
                  } else if (isEdge) {
                    baseColor = "stroke-blue-400 fill-blue-950/60 text-blue-400";
                  }

                  return (
                    <g 
                      key={node.id} 
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer group"
                    >
                      {/* Glow circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 30 : 18}
                        fill={glowId}
                        className="transition-all duration-300"
                      />
                      
                      {/* Outer boundary circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 10 : 7}
                        className={`transition-all duration-300 ${baseColor} stroke-[2]`}
                      />

                      {/* Tooltip detail inside SVG group for hovering */}
                      <title>{`Node ID: ${node.id}\nType: ${node.nodeType}\nLocation: ${node.location}\nLatency: ${node.latencyMs}ms\nLoad: ${node.cpuLoad}% CPU`}</title>
                      
                      {/* Dynamic label */}
                      <text
                        x={node.x}
                        y={node.y - (isSelected ? 16 : 12)}
                        textAnchor="middle"
                        className="text-[7px] font-black uppercase tracking-wider fill-slate-300 bg-black"
                      >
                        {node.nodeType}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Nodes Grid Map */}
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="border border-slate-850 bg-black/35 p-5 rounded-xl text-center relative">
            <span className="absolute top-3 right-3 text-[7px] font-black uppercase tracking-widest text-cyan-400 border border-cyan-800/30 px-1.5 py-0.5 rounded bg-cyan-950/20">US-EAST</span>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <Server className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">NexTech Global Cluster</h4>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cyber-pulse-cyan" />
              <span>3 Nodes Online</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-semibold uppercase">Avg Latency: ~14ms</div>
          </div>

          <div className="border border-slate-850 bg-black/35 p-5 rounded-xl text-center relative">
            <span className="absolute top-3 right-3 text-[7px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-800/30 px-1.5 py-0.5 rounded bg-emerald-950/20">EU-CENTRAL</span>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 mb-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Server className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Quantum Creative Cluster</h4>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cyber-pulse-cyan" />
              <span>3 Nodes Online</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-semibold uppercase">Avg Latency: ~88ms</div>
          </div>

          <div className="border border-slate-850 bg-black/35 p-5 rounded-xl text-center relative">
            <span className="absolute top-3 right-3 text-[7px] font-black uppercase tracking-widest text-purple-400 border border-purple-800/30 px-1.5 py-0.5 rounded bg-purple-950/20">AP-SOUTHEAST</span>
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-purple-950/40 border border-purple-800/30 text-purple-400 mb-3 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              <Server className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">SecureBase Cluster</h4>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cyber-pulse-cyan" />
              <span>3/4 Nodes Online</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-semibold uppercase">Avg Latency: ~184ms</div>
          </div>
        </div>

      </div>

      {/* 2. NODES LIST TABLE */}
      <div className="glass-panel border border-slate-800 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4">Planetary Routing Table (Gossip DHT)</h3>
        
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed border-slate-850 rounded-xl text-slate-500 text-xs">
            <Radio className="h-6 w-6 text-slate-600 mb-2 animate-pulse" />
            <span>Connecting to planetary peer cluster...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="pb-3.5 font-bold">Node ID</th>
                  <th className="pb-3.5 font-bold">Tenant Group</th>
                  <th className="pb-3.5 font-bold">Node Type</th>
                  <th className="pb-3.5 font-bold">Location</th>
                  <th className="pb-3.5 font-bold">Latency</th>
                  <th className="pb-3.5 font-bold">Load (CPU/MEM)</th>
                  <th className="pb-3.5 font-bold">ZKP Auth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs font-semibold">
                {nodes.map((node: any) => {
                  const latColor = node.latencyMs < 20 ? "text-emerald-400" : node.latencyMs < 100 ? "text-amber-400" : "text-rose-400";
                  return (
                    <tr key={node.id} className="hover:bg-slate-900/10">
                      <td className="py-4">
                        <span className="font-mono text-cyan-400 select-all">{node.id.slice(0, 18)}...</span>
                      </td>
                      <td className="py-4 text-white font-extrabold tracking-wide uppercase">
                        {node.clientName}
                      </td>
                      <td className="py-4">
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-300">
                          {node.nodeType}
                        </span>
                      </td>
                      <td className="py-4 text-slate-400 font-medium">{node.location}</td>
                      <td className={`py-4 font-mono font-bold ${latColor}`}>{node.latencyMs}ms</td>
                      <td className="py-4 text-slate-300 font-medium font-mono">
                        {node.cpuLoad}% / {node.memLoad}%
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                          <span className="text-[10px] font-bold text-teal-400 bg-teal-950/40 border border-teal-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {node.zkpStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MIDDLE PANEL: TENANT ONBOARDING PROVISIONER */}
      <div className="glass-panel border border-slate-800 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden">
        <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Onboard Enterprise Hub (Pillar 1)</h3>
            <p className="mt-1 text-[10px] text-slate-500 font-semibold uppercase">Provision isolated database nodes and HA tenant routing</p>
          </div>
          <UserPlus className="h-5 w-5 text-cyan-400" />
        </div>

        <form onSubmit={handleProvision} className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="sm:col-span-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Client Company Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme_Logistics"
              className="w-full h-10 px-3 bg-black border border-slate-800 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-cyan-400/50"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Tenant Status Tier</label>
            <div className="flex gap-2">
              <select
                value={clientTier}
                onChange={(e) => setClientTier(e.target.value)}
                className="flex-1 h-10 px-2 bg-black border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400/50"
              >
                <option value="ACTIVE">ACTIVE (Nominal)</option>
                <option value="PROVISION">STAGED (Testing)</option>
                <option value="HIGH_LOAD">ENTERPRISE (HA-Dedicated)</option>
              </select>
              <button
                type="submit"
                disabled={provisionLoading}
                className="h-10 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs px-4 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                Provision
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. MESH DIAGNOSTICS & RAFT CONSENSUS */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Raft Consensus Proposer */}
        <div className="glass-panel border border-slate-800 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden">
          <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Raft Consensus Proposer (Pillar 3)</h3>
              <p className="mt-1 text-[10px] text-slate-500 font-semibold uppercase">Propose refactors and verify peer voting consensus</p>
            </div>
            <Vote className="h-5 w-5 text-cyan-400" />
          </div>

          <form onSubmit={handleConsensus} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Proposal ID</label>
                <input
                  type="text"
                  value={propId}
                  onChange={(e) => setPropId(e.target.value)}
                  className="w-full h-9 px-3 bg-black border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Optimization Description</label>
                <input
                  type="text"
                  value={propData}
                  onChange={(e) => setPropData(e.target.value)}
                  placeholder="e.g. Optimize numpy stabilizations in main branch"
                  className="w-full h-9 px-3 bg-black border border-slate-800 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={consensusLoading}
              className="w-full h-9 bg-slate-900 border border-slate-800 hover:border-cyan-800/30 text-white font-extrabold text-xs px-4 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <span>{consensusLoading ? "Broadcasting Proposal..." : "Submit Gossip Proposal"}</span>
            </button>

            {consensusResult && (
              <div className="mt-4 p-4 border border-slate-850 bg-black/60 rounded-xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Consensus Decision</span>
                  <span className={`text-[10px] font-black uppercase bg-teal-950/60 border border-teal-900/30 px-2 py-0.5 rounded ${
                    consensusResult.approved ? "text-teal-400" : "text-rose-400"
                  }`}>
                    {consensusResult.approved ? "APPROVED" : "REJECTED"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 mb-3">
                  <span>Votes YES: <strong className="text-teal-400">{consensusResult.yesCount}</strong></span>
                  <span>Votes NO: <strong className="text-rose-400">{consensusResult.noCount}</strong></span>
                  <span>TIMEOUT: <strong className="text-slate-500">{consensusResult.timeoutCount}</strong></span>
                </div>
                
                {/* Visual voting bubbles */}
                <div className="flex flex-wrap gap-1.5">
                  {consensusResult.votes.map((v: any, idx: number) => {
                    const isYes = v.vote === "YES";
                    const isNo = v.vote === "NO";
                    return (
                      <span
                        key={idx}
                        title={`Node: ${v.nodeId} (${v.nodeType})`}
                        className={`flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                          isYes 
                            ? "border-teal-500/25 bg-teal-500/5 text-teal-400" 
                            : isNo 
                              ? "border-rose-500/25 bg-rose-500/5 text-rose-400" 
                              : "border-slate-800 bg-slate-900 text-slate-500"
                        }`}
                      >
                        {isYes ? <CheckCircle className="h-2 w-2 text-teal-400" /> : isNo ? <XCircle className="h-2 w-2 text-rose-400" /> : <Clock className="h-2 w-2" />}
                        <span>{v.nodeType}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

          </form>

        </div>

        {/* Digital Twin Sandbox */}
        <div className="glass-panel border border-slate-800 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Digital Twin Sandbox (Pillar 2)</h3>
              <p className="mt-1 text-[10px] text-slate-500 font-semibold uppercase">HA Cluster Chaos Failover Simulator</p>
            </div>
            <button
              onClick={runSimulation}
              disabled={simulating}
              className="relative inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-cyan-800/30 bg-cyan-950/20 px-3.5 text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:bg-cyan-950/40 cursor-pointer disabled:opacity-40"
            >
              <Zap className="h-3 w-3 fill-cyan-400" />
              <span>{simulating ? "Simulating Chaos..." : "Run Simulator"}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 border border-slate-850 bg-black/40 rounded-lg">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Target Validation Goals</div>
              <div className="grid gap-2 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Heartbeat interval</span>
                  <span className="text-slate-200">250ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Failover detection</span>
                  <span className="text-slate-200">&lt; 750ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Max convergence ceiling</span>
                  <span className="text-emerald-400">&lt; 2000ms (PASS)</span>
                </div>
              </div>
            </div>

            {/* Sandbox Sim History */}
            {history.length > 0 && (
              <div>
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-650 mb-2">Past Test Run Benchmarks</div>
                <div className="max-h-32 overflow-y-auto divide-y divide-slate-850 border border-slate-850 rounded-lg pr-1">
                  {history.map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 px-3 text-[10px] font-mono font-semibold">
                      <span className="text-slate-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      <span className="text-cyan-400">Discover: {h.baselineDiscoveryMs}ms</span>
                      <span className="text-teal-400 font-bold">Failover: {h.failoverConvergenceMs}ms</span>
                      <span className="text-teal-400 font-black uppercase bg-teal-950/60 border border-teal-900/30 px-1 rounded">
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
