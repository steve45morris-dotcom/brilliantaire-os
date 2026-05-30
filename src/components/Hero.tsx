import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Play, Terminal, Cpu, Network, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-28 pb-16 bg-[radial-gradient(ellipse_at_top,rgba(var(--color-primary-foreground),0.15),transparent_70%)]">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-35" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Text Column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Release Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card/60 text-xs font-semibold text-muted-foreground backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              V5.2 Core Release — Mr. 2 Lighter Protocol
            </motion.div>

            {/* Main Cyber Headline */}
            <motion.h1 
              variants={itemVariants} 
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.05]"
            >
              I Build Before <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-[size:200%_auto] animate-gradient-flow bg-clip-text text-transparent">
                Burning.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants} 
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl"
            >
              Welcome to the Supernova creative environment. Command terminal operations, compile campaign telemetry, and route directory write-locks securely via our multi-agent council.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={itemVariants} 
              className="flex flex-col sm:flex-row items-center gap-4 pt-2"
            >
              <Button size="lg" className="w-full sm:w-auto h-12 px-6 gap-2 text-base font-semibold group bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--color-primary),0.3)] transition-all duration-300" asChild>
                <a href="#pricing">
                  Deploy Workspace
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 gap-2 text-base font-semibold border-border hover:bg-muted/80 backdrop-blur-sm">
                <Play className="h-4 w-4 fill-current text-primary" />
                Vocal Interface Demo
              </Button>
            </motion.div>

            {/* Mini Trust Row */}
            <motion.div variants={itemVariants} className="pt-6 border-t border-border/40 max-w-md space-y-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Integrated Systems</p>
              <div className="flex items-center gap-6 text-[11px] font-bold text-muted-foreground/80">
                <span className="flex items-center gap-1"><Terminal className="h-3.5 w-3.5 text-primary" /> OBSIDIAN</span>
                <span className="flex items-center gap-1"><Cpu className="h-3.5 w-3.5 text-secondary" /> NEON COWORKERS</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> CIP SHIELD</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Preview Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.3 }}
            className="lg:col-span-6 relative flex justify-center"
          >
            {/* Visual Glass Box and Gradient Border Glow */}
            <div className="relative w-full max-w-xl group">
              <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-primary/30 to-secondary/30 blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative rounded-2xl border border-border/80 bg-card/40 p-2 backdrop-blur-md overflow-hidden shadow-2xl">
                {/* Simulated UI Window Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/80 tracking-wider">supernova_terminal_telemetry.log</span>
                  <div className="w-8" />
                </div>
                
                {/* Copied Image */}
                <img 
                  src="/cyberpunk-dashboard.png" 
                  alt="Supernova Cybernetic Telemetry Control Panel Dashboard" 
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-auto rounded-lg border border-border/40 hover:scale-[1.01] transition-transform duration-500 object-cover shadow-inner"
                  width={600}
                  height={600}
                />
              </div>
            </div>
          </motion.div>

        </div>

        {/* DaisyUI Supplemental Stats Block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.5 }}
          className="mt-20 w-full"
        >
          <div className="stats stats-vertical lg:stats-horizontal w-full bg-card/25 backdrop-blur-md border border-border/70 rounded-3xl shadow-xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/60">
            
            <div className="stat p-6 sm:p-8 hover:bg-card/20 transition-colors">
              <div className="stat-figure text-primary">
                <Cpu className="h-8 w-8" />
              </div>
              <div className="stat-title text-muted-foreground text-xs font-bold uppercase tracking-wider">Multi-Agent Grid</div>
              <div className="stat-value text-foreground text-3xl font-extrabold mt-1">7 Core Roles</div>
              <div className="stat-desc text-muted-foreground/80 text-xs mt-1">Active background execution logs</div>
            </div>
            
            <div className="stat p-6 sm:p-8 hover:bg-card/20 transition-colors">
              <div className="stat-figure text-secondary">
                <Network className="h-8 w-8" />
              </div>
              <div className="stat-title text-muted-foreground text-xs font-bold uppercase tracking-wider">ASR Queue Stream</div>
              <div className="stat-value text-foreground text-3xl font-extrabold mt-1">0.82s Latency</div>
              <div className="stat-desc text-primary text-xs font-semibold mt-1">VNP Vocal Bridge online</div>
            </div>
            
            <div className="stat p-6 sm:p-8 hover:bg-card/20 transition-colors">
              <div className="stat-figure text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="stat-title text-muted-foreground text-xs font-bold uppercase tracking-wider">Staging Gate Policy</div>
              <div className="stat-value text-foreground text-3xl font-extrabold mt-1">CIP Validated</div>
              <div className="stat-desc text-muted-foreground/80 text-xs mt-1">100% offline local lockouts</div>
            </div>
            
          </div>
        </motion.div>

      </div>
    </section>
  );
}
