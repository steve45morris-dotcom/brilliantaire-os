"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  CircleDot,
  Cpu,
  Disc,
  Flame,
  Globe,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  UserCheck,
  Send,
  GraduationCap
} from "lucide-react";
import { Brand, Module, Project } from "./types";

interface LandingPageProps {
  initialModules: Module[];
  initialProjects: Project[];
  brand: Brand;
}

const getModuleIcon = (id: string) => {
  switch (id) {
    case "core":
      return <Sparkles className="w-4 h-4" />;
    case "labs":
      return <Cpu className="w-4 h-4" />;
    case "media":
      return <Flame className="w-4 h-4" />;
    case "strategy":
      return <Layers className="w-4 h-4" />;
    case "music":
      return <Disc className="w-4 h-4" />;
    case "academy":
      return <GraduationCap className="w-4 h-4" />;
    case "ventures":
      return <Globe className="w-4 h-4" />;
    default:
      return <CircleDot className="w-4 h-4" />;
  }
};

const getModuleColor = (id: string) => {
  switch (id) {
    case "core":
      return "#D6AE55"; // Muted Gold
    case "labs":
      return "#21C55E"; // Telemetry Green
    case "media":
      return "#E05C46"; // Coral Red
    case "strategy":
      return "#3E8BFF"; // System Blue
    case "music":
      return "#F0A641"; // Amber
    case "academy":
      return "#ECEAE2"; // Bone White
    case "ventures":
      return "#E05C46"; // Coral
    default:
      return "#ECEAE2";
  }
};

const statusColors: Record<Project["status"], string> = {
  concept: "text-[#3E8BFF] border-[#3E8BFF]/20 bg-[#3E8BFF]/5",
  draft: "text-[#E05C46] border-[#E05C46]/20 bg-[#E05C46]/5",
  building: "text-[#21C55E] border-[#21C55E]/20 bg-[#21C55E]/5",
  shipped: "text-[#D6AE55] border-[#D6AE55]/20 bg-[#D6AE55]/5",
};

export default function LandingPageClient({
  initialModules,
  initialProjects,
  brand,
}: LandingPageProps) {
  const [activeModuleId, setActiveModuleId] = useState<string>(
    initialModules[0]?.id || "labs"
  );

  const activeModule = useMemo(() => {
    return initialModules.find((m) => m.id === activeModuleId) || initialModules[0];
  }, [initialModules, activeModuleId]);

  const activeBuildsCount = useMemo(() => {
    return initialProjects.filter((p) => p.status === "building").length;
  }, [initialProjects]);

  return (
    <main className="frontpage text-bone-white bg-[#070B0A] font-sans min-h-screen relative">
      {/* Background Matrix Overlay */}
      <div className="frontpage-grid" aria-hidden="true" />

      {/* Primary Sticky Header */}
      <header className="frontpage-nav">
        <a href="#top" className="brand-mark">
          <div className="brand-mark-glyph">BR</div>
          <div>
            <strong>ICYFLAMZE</strong>
            <small>The Brilliantaire OS</small>
          </div>
        </a>
        <nav aria-label="System navigation">
          <a href="#worlds">Worlds</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#collab">Collaborate</a>
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1 border border-border-medium rounded hover:border-gold hover:text-gold transition-all"
          >
            <Terminal className="w-3 h-3 text-[#D6AE55]" />
            COMMAND_DECK
          </a>
        </nav>
      </header>

      {/* Hero Sector (Asymmetric Dashboard Layout) */}
      <section className="hero-shell max-w-7xl mx-auto w-full" id="top">
        <div className="hero-copy">
          <div className="system-kicker">
            <span className="live-dot animate-heartbeat rounded-full inline-block"></span>
            <span>SYSTEM_ACTIVE // STAGE_DECK</span>
          </div>
          <h1>
            Systems
            <br />
            Are the Engine.
          </h1>
          <p className="hero-thesis uppercase tracking-wider text-[#ECEAE2]">
            {brand.thesis}
          </p>
          <p className="hero-position">
            {brand.name} is a Lagos-born {brand.category.toLowerCase()} builder.
            Underneath public music signals lies a deep
            private infrastructure designed to turn raw concepts into identity,
            influence, income, and impact.
          </p>
          <div className="hero-actions">
            <a href="#worlds" className="primary-action cursor-pointer">
              Explore The OS <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/dashboard" className="secondary-action cursor-pointer">
              Access Core Telemetry <Terminal className="w-4 h-4 text-[#D6AE55]" />
            </a>
          </div>
        </div>

        {/* Live System Cockpit HUD */}
        <div className="identity-cockpit rounded relative overflow-hidden">
          <div className="cockpit-topline font-mono text-[9px] text-[#8FA09B]">
            <span>NODE_TELEMETRY // VECTOR_FIELD</span>
            <span className="text-[#21C55E]">CORE_STABLE_100%</span>
          </div>

          {/* Graphical Signal Map */}
          <div className="signal-map flex items-center justify-center relative">
            <svg viewBox="0 0 400 400" className="w-full max-w-[340px]">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E05C46" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#D6AE55" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#21C55E" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Orbital Rings */}
              <circle cx="200" cy="200" r="140" className="map-ring" />
              <circle cx="200" cy="200" r="95" className="map-ring" />
              <circle cx="200" cy="200" r="50" className="map-ring" />

              {/* Animated Pulse Path */}
              <path
                d="M 200 60 A 140 140 0 1 1 199.9 60"
                className="map-route map-route-primary"
              />

              {/* System Node Connectors */}
              <line x1="200" y1="200" x2="200" y2="60" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />
              <line x1="200" y1="200" x2="321" y2="130" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />
              <line x1="200" y1="200" x2="321" y2="270" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />
              <line x1="200" y1="200" x2="200" y2="340" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />
              <line x1="200" y1="200" x2="79" y2="270" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />
              <line x1="200" y1="200" x2="79" y2="130" stroke="rgba(236,234,226,0.12)" strokeWidth="1" />

              {/* Orbital Nodes */}
              <circle cx="200" cy="60" r="5" fill="#E05C46" className="animate-pulse" />
              <circle cx="321" cy="130" r="4" fill="#D6AE55" />
              <circle cx="321" cy="270" r="4" fill="#21C55E" />
              <circle cx="200" cy="340" r="5" fill="#3E8BFF" />
              <circle cx="79" cy="270" r="4" fill="#F0A641" />
              <circle cx="79" cy="130" r="4" fill="#ECEAE2" />

              {/* Central Core Signal */}
              <circle cx="200" cy="200" r="22" fill="#070B0A" stroke="#D6AE55" strokeWidth="2" />
              <text x="200" y="196" className="center-subtext">CORE</text>
              <text x="200" y="209" className="center-text" fill="#D6AE55" fontSize="10">BR-OS</text>

              {/* Node Labels */}
              <text x="200" y="45" textAnchor="middle">Labs</text>
              <text x="335" y="130" textAnchor="start">Media</text>
              <text x="335" y="275" textAnchor="start">Ventures</text>
              <text x="200" y="358" textAnchor="middle">Strategy</text>
              <text x="65" y="275" textAnchor="end">Music</text>
              <text x="65" y="130" textAnchor="end">Academy</text>
            </svg>
          </div>

          {/* Telemetry Numbers */}
          <div className="cockpit-metrics">
            <div>
              <strong>07</strong>
              <span>System worlds</span>
            </div>
            <div>
              <strong>{activeBuildsCount.toString().padStart(2, "0")}</strong>
              <span>Active builds</span>
            </div>
            <div>
              <strong>{initialProjects.length.toString().padStart(2, "0")}</strong>
              <span>Total projects</span>
            </div>
          </div>
        </div>
      </section>

      {/* Modular Ecosystem Panel */}
      <section id="worlds" className="worlds-section max-w-7xl mx-auto w-full">
        <div className="section-heading">
          <span>01 // WORLD_ARCHITECTURE</span>
          <h2>Operating Worlds</h2>
        </div>

        <div className="worlds-layout mt-8">
          {/* Left: Tab selectors */}
          <div className="module-rail">
            {initialModules.map((module, index) => {
              const active = module.id === activeModuleId;
              const toneColor = getModuleColor(module.id);
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  className={`module-tab ${active ? "active" : ""}`}
                  style={{ "--module-tone": toneColor } as React.CSSProperties}
                >
                  <span className="module-index">{(index + 1).toString().padStart(2, "0")}</span>
                  <div className="module-icon">
                    {getModuleIcon(module.id)}
                  </div>
                  <span>{module.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Active Tab Details */}
          {activeModule && (
            <div className="module-detail rounded">
              <div className="module-detail-header">
                <span>SECTOR_DECK // MODULE_{activeModule.id.toUpperCase()}</span>
                <strong>{activeModule.name}</strong>
              </div>
              <p className="my-6 leading-relaxed">
                {activeModule.purpose}
              </p>
              <div>
                <span className="block font-mono text-[9px] text-[#8FA09B] uppercase tracking-widest mb-3">
                  SYSTEM_OUTPUT_ASSETS
                </span>
                <div className="output-grid">
                  {activeModule.outputs.map((output) => (
                    <span key={output}>{output}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Project Flow / Ledger Section */}
      <section id="pipeline" className="pipeline-section max-w-7xl mx-auto w-full">
        <div className="section-heading">
          <span>02 // SYSTEM_PIPELINE</span>
          <h2>Proof Ledger</h2>
        </div>

        <div className="pipeline-list mt-8">
          {initialProjects.map((project, idx) => (
            <article key={project.id} className="pipeline-item rounded overflow-hidden">
              <div className="pipeline-number">
                {(idx + 1).toString().padStart(2, "0")}
              </div>
              <div className="px-6 flex flex-col justify-center">
                <div className="pipeline-meta">
                  <span className="text-[#D6AE55] border-[#D6AE55]/20 bg-[#D6AE55]/5">
                    {project.lane.toUpperCase()}
                  </span>
                  <span className={statusColors[project.status]}>
                    {project.status.toUpperCase()}
                  </span>
                  <span className="text-[#8FA09B] border-border-medium bg-transparent">
                    {project.priority.toUpperCase()}_PRIORITY
                  </span>
                </div>
                <h3>{project.name}</h3>
                <p>
                  <span className="text-[#8FA09B] uppercase font-mono text-[9px] mr-1.5">Output target:</span>
                  {project.output}
                </p>
              </div>
              <div className="pipeline-action flex flex-col justify-center">
                <span>Immediate Move</span>
                <strong>{project.next_action}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Collaboration Command Panel */}
      <section id="collab" className="collab-section max-w-7xl mx-auto w-full pb-16">
        <div className="collab-panel rounded">
          <div>
            <span>03 // BRIEF_DESK</span>
            <h2>Submit a Brief</h2>
            <p>
              For brands, artists, founders, and creative partners who need structured
              intelligence behind their cultural output. Submit requests directly to the
              Brilliantaire Strategy Desk.
            </p>
          </div>
          <div className="collab-checks">
            <span>
              <UserCheck className="w-4 h-4 text-[#D6AE55]" /> Brand Rollouts
            </span>
            <span>
              <Activity className="w-4 h-4 text-[#21C55E]" /> AI Workflows
            </span>
            <span>
              <Send className="w-4 h-4 text-[#E05C46]" /> System Integration
            </span>
            <a
              href="mailto:contact@icyflamze.com?subject=Brilliantaire%20OS%20Brief"
              className="primary-action cursor-pointer justify-center mt-3 text-center border font-bold text-[#100d08] bg-[#D6AE55] border-[#D6AE55] hover:bg-[#ECEAE2] hover:border-[#ECEAE2] transition-all"
            >
              Contact Desk
            </a>
          </div>
        </div>
      </section>

      {/* Footer coordinates */}
      <footer className="border-t border-border-medium py-8 px-6 text-[10px] font-mono text-[#8FA09B] tracking-wider bg-[#070B0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4">
          <span>DESIGNED FOR SOVEREIGN CONTROL // LAGOS TO GLOBAL</span>
          <span>© 2026 ICYFLAMZE THE BRILLIANTAIRE. ALL RIGHTS PRESERVED.</span>
        </div>
      </footer>
    </main>
  );
}
