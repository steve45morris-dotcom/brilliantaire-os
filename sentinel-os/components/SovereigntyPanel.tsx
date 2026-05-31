"use client";

import { useState, useEffect } from "react";
import { 
  FolderPlus, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight, 
  RefreshCw, 
  Coins, 
  ExternalLink,
  Lock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface MicroProduct {
  id: string;
  name: string;
  template: string;
  deploymentUrl: string;
  status: string;
  timestamp: string;
}

export function SovereigntyPanel() {
  const [products, setProducts] = useState<MicroProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deployName, setDeployName] = useState("");
  const [deployTemplate, setDeployTemplate] = useState("Vite React");
  const [deployLoading, setDeployLoading] = useState(false);

  // Settlement Bridge states
  const [selectedClient, setSelectedClient] = useState("client-b2c0f84a");
  const [settleAmount, setSettleAmount] = useState("45000");
  const [sourceBridge, setSourceBridge] = useState("Stripe Financial Rails");
  const [destBridge, setDestBridge] = useState("SOV Token (ERC-20)");
  const [settleReceipt, setSettleReceipt] = useState<any>(null);
  const [settleLoading, setSettleLoading] = useState(false);

  // ZK Audit states
  const [zkResult, setZkResult] = useState<any>(null);
  const [zkLoading, setZkLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clients = [
    { id: "client-b2c0f84a", name: "Quantum_Creative" },
    { id: "client-3c136c8c", name: "NexTech_Global" },
    { id: "client-467d5bce", name: "SecureBase_Inc" }
  ];

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/mesh/microproducts");
      const json = await res.json();
      if (json.ok) {
        setProducts(json.products);
      }
    } catch {
      setError("Failed to load micro-products list.");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function handleDeployProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!deployName.trim()) {
      alert("Micro-product name is required");
      return;
    }
    setDeployLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/microproducts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deployName.trim(), template: deployTemplate }),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess(`Micro-product '${deployName}' compiled and deployed successfully!`);
        setDeployName("");
        await loadProducts();
      } else {
        setError(json.error || "Deployment failed.");
      }
    } catch {
      setError("Network error deploying product.");
    } finally {
      setDeployLoading(false);
    }
  }

  async function handleBridgeSettlement(e: React.FormEvent) {
    e.preventDefault();
    setSettleLoading(true);
    setSettleReceipt(null);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient,
          amount: settleAmount,
          sourceBridge,
          destBridge
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSettleReceipt(json.receipt);
        setSuccess(`Bridge swap processed: reconciled $${settleAmount} to decentralized ledger.`);
      } else {
        setError(json.error || "Settlement swap failed.");
      }
    } catch {
      setError("Network error during bridge settlement.");
    } finally {
      setSettleLoading(false);
    }
  }

  async function handleRunZKAudit() {
    setZkLoading(true);
    setZkResult(null);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/zk-audit", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setZkResult(json.result);
        setSuccess("Zero-Knowledge audit sweep completed. Integrity proof pass!");
      } else {
        setError(json.error || "ZK audit sweep failed.");
      }
    } catch {
      setError("Network error executing ZK sweep.");
    } finally {
      setZkLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="grid gap-6">
      
      {/* 1. MICRO-PRODUCT COMPILER FACTORY */}
      <div className="glass-panel border border-cyan-500/30 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-pulse" />
        
        <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Micro-Product Factory (Task 2.1)
            </h3>
            <p className="text-xs text-slate-400 mt-1">Compile and deploy standalone agent pages and monetization landing pages dynamically.</p>
          </div>
          <button 
            onClick={loadProducts}
            disabled={loadingProducts}
            className="text-slate-500 hover:text-cyan-400 transition disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingProducts ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-450 glow-text-danger mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs font-semibold text-teal-400 glow-text-cyan mb-4">
            {success}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Spawn form */}
          <form onSubmit={handleDeployProduct} className="border border-slate-850 bg-black/40 p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Product Deployer</span>
              
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">App Domain Handle</label>
                <input
                  type="text"
                  value={deployName}
                  onChange={(e) => setDeployName(e.target.value)}
                  placeholder="e.g. music-licensing"
                  className="w-full h-9 px-3 bg-black border border-slate-800 rounded text-xs font-semibold text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Stack Template</label>
                <select
                  value={deployTemplate}
                  onChange={(e) => setDeployTemplate(e.target.value)}
                  className="w-full h-9 px-2 bg-black border border-slate-800 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                >
                  <option value="Astro SaaS Starter">Astro SaaS Starter</option>
                  <option value="Vite React Minimal">Vite React Minimal</option>
                  <option value="Next.js App Router API">Next.js App Router API</option>
                  <option value="Static HTML Landing Page">Static HTML Landing Page</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={deployLoading}
              className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 border border-cyan-500/40 text-cyan-300 rounded hover:bg-cyan-950/40 hover:border-cyan-300 transition text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              {deployLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Compile & Deploy App <ArrowUpRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Deployed list */}
          <div className="md:col-span-2 border border-slate-850 bg-black/40 p-4 rounded-xl">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-3">Deployed Micro-Agent Applications</span>
            <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
              {products.length === 0 ? (
                <div className="text-[10px] text-slate-500 font-medium py-8 text-center uppercase tracking-wide border border-dashed border-slate-850 rounded-lg">
                  No compiled apps online.
                </div>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-900 pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-black tracking-wide">{p.name}</span>
                        <span className="text-[8px] font-bold text-slate-500 border border-slate-850 px-1 py-0.2 rounded bg-slate-950 font-mono">
                          {p.template}
                        </span>
                      </div>
                      <a 
                        href={p.deploymentUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[10px] text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 font-semibold"
                      >
                        {p.deploymentUrl} <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-teal-900/30 bg-teal-950/40 text-teal-400 tracking-wider">
                      <CheckCircle2 className="h-2.5 w-2.5 text-teal-400" />
                      <span>{p.status}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DECENTRALIZED SETTLEMENT BRIDGE */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Settlement Form */}
        <div className="md:col-span-2 border border-purple-500/30 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />
          
          <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Coins className="h-4 w-4 text-purple-400" />
                Decentralized Settlement Bridge (Task 2.2)
              </h3>
              <p className="text-xs text-slate-400 mt-1">Cross-bridge financial swaps, reconciling invoice ledgers with on-chain assets.</p>
            </div>
          </div>

          <form onSubmit={handleBridgeSettlement} className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Select Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full h-9 px-2 bg-black border border-slate-850 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Settlement Swap Value ($ USD)</label>
              <input
                type="number"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                className="w-full h-9 px-3 bg-black border border-slate-850 rounded text-xs font-semibold text-white focus:outline-none focus:border-purple-500/50 font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Source Settlement Bridge</label>
              <select
                value={sourceBridge}
                onChange={(e) => setSourceBridge(e.target.value)}
                className="w-full h-9 px-2 bg-black border border-slate-850 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="Stripe Financial Rails">Stripe Financial Rails</option>
                <option value="Solana USDC Bridge">Solana USDC Bridge</option>
                <option value="Ethereum Smart Invoicing Tunnel">Ethereum Smart Invoicing Tunnel</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Destination Settlement Ledger</label>
              <select
                value={destBridge}
                onChange={(e) => setDestBridge(e.target.value)}
                className="w-full h-9 px-2 bg-black border border-slate-850 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="SOV Token (ERC-20)">SOV Token (ERC-20)</option>
                <option value="USDC Vault Enclave">USDC Vault Enclave</option>
                <option value="USD Bank Wire Clearing">USD Bank Wire Clearing</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={settleLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-purple-500/40 text-purple-300 rounded hover:bg-purple-950/40 hover:border-purple-300 transition text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40"
              >
                {settleLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Execute Settlement Swap <Coins className="h-3.5 w-3.5 text-purple-400" />
                  </>
                )}
              </button>
            </div>
          </form>

          {settleReceipt && (
            <div className="mt-4 p-4 border border-slate-850 bg-black/60 rounded-xl animate-fade-in text-[10px] font-mono text-slate-300 space-y-1.5">
              <div className="flex justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                <span className="text-slate-500 font-bold uppercase text-[9px]">Receipt Token</span>
                <span className="text-emerald-400 font-black">{settleReceipt.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TX Hash:</span>
                <span className="text-purple-300 select-all font-bold">{settleReceipt.txHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Value cleared:</span>
                <span className="text-slate-100 font-bold">${settleReceipt.amount.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bridges swap:</span>
                <span className="text-slate-100 uppercase">{settleReceipt.sourceBridge} → {settleReceipt.destBridge}</span>
              </div>
            </div>
          )}
        </div>

        {/* ZK Audit Sweep */}
        <div className="border border-emerald-500/30 bg-[#040811]/45 p-6 rounded-2xl relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.15)] flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse" />
          
          <div>
            <div className="border-b border-slate-850 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-450" />
                  ZK System Audit Sweep (Task 3.1)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Compute SHA-256 block chain proofs over all ledger states to guarantee history integrity.</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed uppercase font-semibold">
              Runs a Zero-Knowledge hash-chain validity validator covering the entire `sovereign_ledger` database rows. Pass validates client isolation.
            </p>
          </div>

          <div>
            {zkResult && (
              <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-[10px] font-mono mb-4 space-y-1 animate-fade-in">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Audit Pass</span>
                  <span className="text-teal-400 font-black">VALID: PASS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blocks Checked:</span>
                  <span className="text-slate-100 font-bold">{zkResult.blockCount}</span>
                </div>
                <div className="flex flex-col mt-1 border-t border-emerald-950 pt-1">
                  <span className="text-slate-500">ZK Root Hash:</span>
                  <span className="text-teal-400 font-bold break-all select-all font-mono text-[9px] mt-0.5 leading-snug">
                    {zkResult.rootHash}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleRunZKAudit}
              disabled={zkLoading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-emerald-500/40 text-emerald-300 rounded hover:bg-emerald-950/40 hover:border-emerald-300 transition text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-40"
            >
              {zkLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Run ZK Verification Sweep <ShieldCheck className="h-3.5 w-3.5 text-emerald-450" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
      
    </div>
  );
}
