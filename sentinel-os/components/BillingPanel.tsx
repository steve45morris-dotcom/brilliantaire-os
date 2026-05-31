"use client";

import { useEffect, useState } from "react";
import { CreditCard, DollarSign, ArrowUpRight, Check, Activity, ShieldCheck, RefreshCw } from "lucide-react";

export function BillingPanel() {
  const [tier, setTier] = useState<"PRO" | "ENTERPRISE">("PRO");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState("client-b2c0f84a");
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clients = [
    { id: "client-b2c0f84a", name: "Quantum_Creative" },
    { id: "client-3c136c8c", name: "NexTech_Global" },
    { id: "client-467d5bce", name: "SecureBase_Inc" }
  ];

  async function loadInvoices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mesh/billing");
      const json = await res.json();
      if (json.ok) {
        setInvoices(json.invoices);
      } else {
        setError(json.error || "Failed to load invoices.");
      }
    } catch (err) {
      setError("Network error fetching invoices.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulatePayment(e: React.FormEvent) {
    e.preventDefault();
    setPayLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mesh/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClient }),
      });
      const json = await res.json();
      if (json.ok) {
        setSuccess("Stripe payment simulated successfully! Ledger synced.");
        await loadInvoices();
      } else {
        setError(json.error || "Failed to simulate payment.");
      }
    } catch (err) {
      setError("Network error initiating payment.");
    } finally {
      setPayLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="border border-purple-500/30 bg-slate-950/70 p-6 rounded-lg backdrop-blur-md relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)]">
      {/* Laser line gradient accent */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            Stripe Ledger Billing Gateway
          </h3>
          <p className="text-xs text-slate-400 mt-1">Compute node licensing tier, usage metering, and invoice status.</p>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded gap-1">
          <button
            onClick={() => setTier("PRO")}
            className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              tier === "PRO"
                ? "bg-purple-600 text-white font-black"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Sovereign Pro
          </button>
          <button
            onClick={() => setTier("ENTERPRISE")}
            className={`px-3 py-1 rounded text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              tier === "ENTERPRISE"
                ? "bg-purple-600 text-white font-black"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Cosmic Enterprise
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs font-semibold text-rose-450 glow-text-danger mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-3 text-xs font-semibold text-teal-400 glow-text-cyan mb-4">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tier Info */}
        <div className="border border-slate-800 bg-slate-900/50 p-4 rounded flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Active Plan</span>
            <div className="text-xl font-black text-purple-200 mt-1 uppercase tracking-wider">
              {tier === "PRO" ? "Sovereign Pro" : "Cosmic Enterprise"}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {tier === "PRO"
                ? "Allocates 12 CPU-equivalent threads dynamically across planetary consensus channels."
                : "Allocates 48 CPU-equivalent threads with infinite mesh consensus fallback and 0 ms failover."}
            </p>
          </div>
          <div className="mt-6 flex items-baseline gap-1.5 border-t border-slate-800/60 pt-4">
            <span className="text-2xl font-black text-purple-400 font-mono">
              {tier === "PRO" ? "$199" : "$999"}
            </span>
            <span className="text-xs text-slate-500">/ mo</span>
          </div>
        </div>

        {/* Live Invoices List */}
        <div className="border border-slate-800 bg-slate-900/50 p-4 rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-850 pb-2 mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block">Sales Ledger Invoices</span>
              <button 
                onClick={loadInvoices} 
                disabled={loading}
                className="text-slate-500 hover:text-purple-400 transition disabled:opacity-40 cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin text-purple-400" : ""}`} />
              </button>
            </div>
            <div className="mt-2 space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {invoices.length === 0 ? (
                <div className="text-[10px] text-slate-500 font-medium py-4 text-center">No invoices recorded.</div>
              ) : (
                invoices.slice(0, 4).map((inv) => (
                  <div key={inv.id} className="flex flex-col text-[10px] border-b border-slate-900/60 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3 w-3 text-slate-400" />
                        <span className="font-mono text-slate-300 font-bold select-all">{inv.stripe_id.slice(0, 14)}...</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-1 py-0.2 rounded font-black text-[8px] uppercase">
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-450 mt-1 font-semibold">
                      <span className="uppercase">{inv.target_name}</span>
                      <span className="font-mono text-slate-300">{inv.notes.split("for ")[1] || "Mesh Node"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-4 flex items-center gap-1 border-t border-slate-900 pt-2">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400/80" />
            Decentralized ledger sync active
          </div>
        </div>

        {/* Live Invoicing Trigger */}
        <div className="border border-slate-800 bg-slate-900/50 p-4 rounded flex flex-col justify-between">
          <form onSubmit={handleSimulatePayment} className="flex flex-col justify-between h-full">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2.5">Simulate Node Billing</span>
              
              <div className="mb-3">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">Select Client Node</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full h-8 px-2 bg-black border border-slate-800 rounded text-xs font-semibold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-450 leading-relaxed uppercase font-semibold">
                Will calculate client's active nodes count, compute MRR ($1250/node), generate a unique Stripe Subscription ID, and persist to `sales_ledger`.
              </p>
            </div>
            
            <button
              type="submit"
              disabled={payLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 border border-purple-500/40 text-purple-300 rounded hover:bg-purple-950/40 hover:border-purple-300 transition text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer"
            >
              {payLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Charge Client via Stripe <ArrowUpRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
