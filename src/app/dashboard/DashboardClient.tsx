"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Disc, 
  FolderGit2, 
  ArrowLeft, 
  Plus, 
  Minus, 
  CheckSquare, 
  Activity, 
  Sparkles,
  Calendar,
  Flame,
  Database,
  Copy,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Globe,
  Orbit,
  Tv,
  Waves,
  Compass
} from "lucide-react";
import { Project, WeeklyData } from "../types";

interface DashboardClientProps {
  initialWeekly: WeeklyData;
  initialProjects: Project[];
  commandCenterMd: string;
  executionReports?: {
    missionRouter: any;
    projectLaneRunner: any;
  };
}

const themeStyles = {
  neon: {
    "--sn-primary": "#06b6d4",
    "--sn-secondary": "#8b5cf6",
    "--sn-accent": "#f43f5e",
    "--sn-primary-glow": "rgba(6, 182, 212, 0.15)",
    "--sn-primary-glow-strong": "rgba(6, 182, 212, 0.35)",
    "--ink-bg": "#02040a",
    "--border-subtle": "rgba(6, 182, 212, 0.08)",
    "--border-medium": "rgba(6, 182, 212, 0.15)",
    "--border-active": "rgba(6, 182, 212, 0.4)",
  },
  solaris: {
    "--sn-primary": "#f59e0b",
    "--sn-secondary": "#fb923c",
    "--sn-accent": "#ef4444",
    "--sn-primary-glow": "rgba(245, 158, 11, 0.15)",
    "--sn-primary-glow-strong": "rgba(245, 158, 11, 0.35)",
    "--ink-bg": "#0b0600",
    "--border-subtle": "rgba(245, 158, 11, 0.08)",
    "--border-medium": "rgba(245, 158, 11, 0.15)",
    "--border-active": "rgba(245, 158, 11, 0.4)",
  },
  quantum: {
    "--sn-primary": "#d946ef",
    "--sn-secondary": "#a855f7",
    "--sn-accent": "#ec4899",
    "--sn-primary-glow": "rgba(217, 70, 239, 0.15)",
    "--sn-primary-glow-strong": "rgba(217, 70, 239, 0.35)",
    "--ink-bg": "#09010c",
    "--border-subtle": "rgba(217, 70, 239, 0.08)",
    "--border-medium": "rgba(217, 70, 239, 0.15)",
    "--border-active": "rgba(217, 70, 239, 0.4)",
  }
};

export default function DashboardClient({
  initialWeekly,
  initialProjects,
  commandCenterMd,
  executionReports
}: DashboardClientProps) {
  const [weekly, setWeekly] = useState<WeeklyData>(initialWeekly);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [sysStatus, setSysStatus] = useState<string>("CORE_MONITOR_ACTIVE");
  const [isSavedLocally, setIsSavedLocally] = useState<boolean>(true);
  const [terminalTab, setTerminalTab] = useState<"logs" | "changes" | "capture" | "vnp">("logs");
  
  // Interactive HUD States
  const [activeTheme, setActiveTheme] = useState<"neon" | "solaris" | "quantum">("neon");
  const [isDroneActive, setIsDroneActive] = useState<boolean>(false);
  const [speechActive, setSpeechActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [astraAnalyzing, setAstraAnalyzing] = useState<boolean>(false);
  const [astraReport, setAstraReport] = useState<string[]>([]);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [selectedRadarProject, setSelectedRadarProject] = useState<string | null>(null);
  const [isCrtEnabled, setIsCrtEnabled] = useState<boolean>(true);
  const [isScanlineEnabled, setIsScanlineEnabled] = useState<boolean>(true);
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [cmdInput, setCmdInput] = useState<string>("");
  const [telemetry, setTelemetry] = useState({
    lat: 6.5244,
    lon: 3.3792,
    az: 212.85,
    speed: 35.7,
    temp: 52.4
  });

  // Audio nodes refs for cleanup
  const droneOscillatorRef = React.useRef<OscillatorNode | null>(null);
  const droneGainRef = React.useRef<GainNode | null>(null);
  const droneAudioContextRef = React.useRef<AudioContext | null>(null);

  // Form states for new ideas
  const [newIdea, setNewIdea] = useState({
    name: "",
    lane: "Labs",
    next_action: "",
    output: ""
  });
  const [formMsg, setFormMsg] = useState("");

  const daysOfWeek = [
    { num: 0, label: "Sunday", task: "Review (Measure progress, update OS, archive ideas)", code: "SUN_REV" },
    { num: 1, label: "Monday", task: "Command (Review priorities, pick 3 outcomes, assign work)", code: "MON_CMD" },
    { num: 2, label: "Tuesday", task: "Build (Work on Labs, software, code, dashboards)", code: "TUE_BLD" },
    { num: 3, label: "Wednesday", task: "Package (Turn work into offers, content, assets, decks)", code: "WED_PKG" },
    { num: 4, label: "Thursday", task: "Publish (Release content, build logs, updates, music)", code: "THU_PUB" },
    { num: 5, label: "Friday", task: "Network (Contact collaborators, founders, brands)", code: "FRI_NET" },
    { num: 6, label: "Saturday", task: "Music/Media (Record, perform, edit visual concepts)", code: "SAT_MUS" }
  ];

  const currentDayNum = new Date().getDay();

  const mr = executionReports?.missionRouter;
  const plr = executionReports?.projectLaneRunner;

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText("COMMAND_COPIED_TO_CLI");
    triggerSysLog("CLI_COPIED");
    playBeep(1200, 0.08);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Programmatic Web Audio Telemetry Synthesizer Beeps
  const playBeep = (freq = 880, duration = 0.04) => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Browser audio context blocked silently
    }
  };

  // Upgraded Space Cabin Hum Generator
  const toggleCabinDrone = () => {
    if (typeof window === "undefined") return;
    try {
      if (isDroneActive) {
        if (droneOscillatorRef.current) {
          droneOscillatorRef.current.stop();
          droneOscillatorRef.current.disconnect();
          droneOscillatorRef.current = null;
        }
        if (droneGainRef.current) {
          droneGainRef.current.disconnect();
          droneGainRef.current = null;
        }
        setIsDroneActive(false);
        setBootLogs(prev => [...prev, "SYSTEM: SHUTTING DOWN CABIN DRONE GENERATORS... [OFF]"]);
        playBeep(440, 0.1);
      } else {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        droneAudioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(110, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.setValueAtTime(0.35, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(25, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.015, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        lfo.start();
        osc.start();

        droneOscillatorRef.current = osc;
        droneGainRef.current = gain;
        
        setIsDroneActive(true);
        setBootLogs(prev => [...prev, "SYSTEM: CABIN DRONE GENERATOR INITIALIZED (55Hz SAW + LFO SWEEP)... [ON]"]);
        playBeep(880, 0.1);
      }
    } catch (err) {
      console.error("Drone failed to start", err);
    }
  };

  // Soundboard event triggers
  const playSoundEffect = (type: "boot" | "radar" | "shield" | "alert") => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      gain.connect(ctx.destination);
      osc.connect(gain);
      
      if (type === "boot") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(90, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
        triggerSysLog("HUD_BOOT_SEQUENCE_TRIGGERED");
      } else if (type === "radar") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.9);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
        triggerSysLog("HOLO_RADAR_BEAM_BURST");
      } else if (type === "shield") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
        triggerSysLog("SHIELD_SYSTEMS_CHARGE");
      } else if (type === "alert") {
        osc.type = "square";
        osc.frequency.setValueAtTime(700, ctx.currentTime);
        osc.frequency.setValueAtTime(350, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(700, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
        triggerSysLog("WARNING_ALERT_TRANSMITTING");
      }
    } catch {
      // Audio context blocked
    }
  };

  const speakMessage = (message: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.onstart = () => setSpeechActive(true);
      utterance.onend = () => setSpeechActive(false);
      utterance.onerror = () => setSpeechActive(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeechActive(false);
    }
  };

  const playSequence = () => {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => playBeep(freq, 0.15), idx * 140);
    });
  };

  // Web Speech Recognition API Integration
  const startSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBootLogs(prev => [...prev, "ERROR: WEB_SPEECH_RECOGNITION NOT SUPPORTED BY BROWSER"]);
      triggerSysLog("SPEECH_NOT_SUPPORTED");
      playBeep(440, 0.1);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        triggerSysLog("SPEECH_RECOGNITION_ON");
        playBeep(900, 0.08);
        setBootLogs(prev => [...prev, "SYSTEM: SPEECH SYNAPSE LISTENING... SPEAK NOW"]);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        setBootLogs(prev => [...prev, `SPEECH_INPUT: "${transcript}"`]);
        processVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsListening(false);
        setBootLogs(prev => [...prev, `SPEECH_ERROR: ${event.error.toUpperCase()}`]);
        triggerSysLog("SPEECH_RECOGNITION_ERR");
        playBeep(440, 0.15);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const processVoiceCommand = (command: string) => {
    playBeep(880, 0.06);
    
    if (command.includes("help") || command.includes("list")) {
      speakMessage("Available voice commands: help, matrix scan, play synthesizer, warning, boot, start drone, stop hum, run job.");
      setBootLogs(prev => [...prev, "SYSTEM: VOICECMD LISTED HELP DIALOG"]);
    } else if (command.includes("matrix scan") || command.includes("scan")) {
      triggerSysLog("COMPILING_COCKPIT_GRID");
      setRadarAngle((prev) => prev + 120);
      playSequence();
      speakMessage("Executing matrix coordinates scan.");
      setBootLogs(prev => [...prev, "VOCALCMD: EXECUTING VECTOR COORDINATE SCAN..."]);
    } else if (command.includes("synthesizer") || command.includes("synth") || command.includes("play synth")) {
      playSequence();
      speakMessage("Oscillator signals active.");
      setBootLogs(prev => [...prev, "VOCALCMD: TRIG OSCILLATORS // SUCCESS"]);
    } else if (command.includes("warning") || command.includes("alert")) {
      playSoundEffect("alert");
      speakMessage("Warning alert signal active.");
      setBootLogs(prev => [...prev, "VOCALCMD: SYS ALARM ENGAGED"]);
    } else if (command.includes("boot") || command.includes("reboot")) {
      playSoundEffect("boot");
      speakMessage("Virtual shell boot initialized.");
      setBootLogs(prev => [...prev, "VOCALCMD: REBOOTING COMPILER..."]);
    } else if (command.includes("drone") || command.includes("ambient hum") || command.includes("start drone")) {
      if (!isDroneActive) {
        toggleCabinDrone();
        speakMessage("Cabin drone generator online.");
      } else {
        speakMessage("Cabin drone is already active.");
      }
    } else if (command.includes("stop") || command.includes("shut down") || command.includes("turn off")) {
      if (isDroneActive) {
        toggleCabinDrone();
        speakMessage("Cabin drone offline.");
      } else {
        speakMessage("Cabin hum is already inactive.");
      }
    } else if (command.includes("trigger run") || command.includes("run dag") || command.includes("run job")) {
      const cleaned = command.replace("trigger run", "").replace("run dag", "").replace("run job", "").trim();
      const matchedDag = mr?.dagu?.summary?.map((s: string) => s.split(":")[0]?.trim()).find((name: string) => cleaned.includes(name.replace(/-/g, " ")) || name.replace(/-/g, " ").includes(cleaned));
      if (matchedDag) {
        speakMessage(`Starting workflow job ${matchedDag.replace(/-/g, " ")}`);
        runDagWorkflow(matchedDag);
      } else {
        speakMessage(`Could not locate workflow matching ${cleaned}`);
        setBootLogs(prev => [...prev, `VOCALCMD: JOB MATCH FAILED FOR "${cleaned}"`]);
      }
    } else {
      speakMessage(`Unknown cockpit instruction: ${command}`);
      setBootLogs(prev => [...prev, `VOCALCMD ERROR: NO COMPILER RULE FOR "${command}"`]);
    }
  };

  // Show status indicator
  const triggerSysLog = (msg: string) => {
    setSysStatus(msg);
    setTimeout(() => {
      setSysStatus("CORE_MONITOR_ACTIVE");
    }, 4000);
  };

  // Telemetry sensors simulation loop
  useEffect(() => {
    const coordsInterval = setInterval(() => {
      setTelemetry(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.00015,
        lon: prev.lon + (Math.random() - 0.5) * 0.00015,
        az: Math.round((prev.az + (Math.random() - 0.5) * 0.6) * 100) / 100,
        speed: Math.round((35.7 + (Math.random() - 0.5) * 0.5) * 10) / 10,
        temp: Math.round((52.4 + (Math.random() - 0.5) * 1.8) * 10) / 10
      }));
    }, 1500);
    return () => clearInterval(coordsInterval);
  }, []);

  // Radar sweep angle
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 1.8) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // HTML5 Canvas Background Particle Mesh simulating flight telemetry dust field
  useEffect(() => {
    if (typeof window === "undefined") return;
    const canvas = document.getElementById("hud-particle-canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle generator
    const particleCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5
      });
    }

    // Mouse interactive links
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Color mapping
      let colorPrimary = "rgba(6, 182, 212, 0.25)";
      let colorLine = "rgba(6, 182, 212, 0.05)";
      if (activeTheme === "solaris") {
        colorPrimary = "rgba(245, 158, 11, 0.25)";
        colorLine = "rgba(245, 158, 11, 0.05)";
      } else if (activeTheme === "quantum") {
        colorPrimary = "rgba(217, 70, 239, 0.25)";
        colorLine = "rgba(217, 70, 239, 0.05)";
      }

      // Draw lines (mesh)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = colorLine;
            ctx.lineWidth = 0.5 * (1 - dist / 120);
            ctx.stroke();
          }
        }

        // Mouse connection
        const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y);
        if (mouseDist < 160) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = activeTheme === "neon" ? "rgba(6, 182, 212, 0.08)" : activeTheme === "solaris" ? "rgba(245, 158, 11, 0.08)" : "rgba(217, 70, 239, 0.08)";
          ctx.lineWidth = 0.8 * (1 - mouseDist / 160);
          ctx.stroke();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI * 2);
        ctx.fillStyle = colorPrimary;
        ctx.fill();

        // Move particle
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce borders
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTheme]);

  // Console log diagnostics stream
  useEffect(() => {
    const logLines = [
      "SYSTEM: MOUNTING CORE OPERATIONS PORT...",
      "SYSTEM: VALIDATING Obsidian LOCAL CACHE COORDINATES...",
      "SYSTEM: DETECTED ACTIVE CHANNELS IN PROJECTS VAULT...",
      "SYSTEM: INTERACTION SYNTHESIZER ONLINE (WEB_AUDIO OK)",
      "SYSTEM: INTEGRATING FLIGHT INTERACTION CLI PROTOCOL...",
      "SYSTEM: 100X SOVEREIGN ENGINE ACTIVE. ENTER /help IN TERMINAL."
    ];
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < logLines.length) {
        setBootLogs((prev) => [...prev, logLines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 550);
    return () => clearInterval(interval);
  }, []);

  // Action CLI command processor
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const input = cmdInput.trim();
    const args = input.split(" ");
    const command = args[0].toLowerCase();

    playBeep(980, 0.06);
    setBootLogs((prev) => [...prev, `[SYSTEM-CLI:~]$ ${input}`]);

    switch (command) {
      case "/help":
        setBootLogs((prev) => [
          ...prev,
          "AVAILABLE HUD SHELL ACTIONS:",
          "  /help                - List system CLI inputs",
          "  /scan                - Re-initialize coordinate sweep on radar",
          "  /synth               - Trigger audio synthesizer arpeggiator notes",
          "  /vnp [msg]           - Broadcast voice bridge TTS alert on browser",
          "  /clear               - Flush diagnostic boot screen",
          "  /matrix              - Execute active binary compilation"
        ]);
        break;
      case "/scan":
        triggerSysLog("COMPILING_COCKPIT_GRID");
        setRadarAngle((prev) => prev + 120);
        playSequence();
        setBootLogs((prev) => [
          ...prev,
          "SCANNING VECTOR MATRIX COORDINATES...",
          `COMPLETED: LOCATED ${projects.length} STAGE CHANNELS IN VAULT.`
        ]);
        break;
      case "/synth":
        playSequence();
        setBootLogs((prev) => [...prev, "PLAYING OSCILLATOR SIGNAL SEQUENCE // [OK]"]);
        break;
      case "/clear":
        setBootLogs([]);
        break;
      case "/vnp":
        const message = args.slice(1).join(" ") || "One System online. Telemetry secure.";
        triggerSysLog("VNP_AUDIO_TRANSMITTING");
        playSequence();
        setBootLogs((prev) => [
          ...prev,
          `TRANSMITTING VOCAL SYNAPSE PATH: "${message}"`,
          "[OK] BROADCAST AUDIO SENT"
        ]);
        // Speech API
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
        break;
      case "/matrix":
        setBootLogs((prev) => [
          ...prev,
          "01010111 01000101 01000010 00100000 01001111 01010011",
          "COGNITIVE DECK // ARCHITECT MATRIX ONLINE"
        ]);
        break;
      default:
        setBootLogs((prev) => [...prev, `ERROR: Command "${command}" not recognized. Enter /help.`]);
    }
    setCmdInput("");
  };

  // Save weekly helper
  const saveWeeklyToStorage = (updatedWeekly: WeeklyData) => {
    try {
      localStorage.setItem("br-os-weekly", JSON.stringify(updatedWeekly));
      setIsSavedLocally(true);
      triggerSysLog("SYS_WEEKLY_SAVE_OK");
    } catch {
      triggerSysLog("SAVE_FAILED_STORAGE_BLOCKED");
    }
  };

  // Save projects helper
  const saveProjectsToStorage = (updatedProjects: Project[]) => {
    try {
      localStorage.setItem("br-os-projects", JSON.stringify(updatedProjects));
      setIsSavedLocally(true);
      triggerSysLog("SYS_PROJECTS_SAVE_OK");
    } catch {
      triggerSysLog("SAVE_FAILED_STORAGE_BLOCKED");
    }
  };

  // Handlers for metrics
  const handleMetricChange = (key: keyof WeeklyData["metrics"], delta: number) => {
    const updatedWeekly = {
      ...weekly,
      metrics: {
        ...weekly.metrics,
        [key]: Math.max(0, weekly.metrics[key] + delta)
      }
    };
    setWeekly(updatedWeekly);
    setIsSavedLocally(false);
    saveWeeklyToStorage(updatedWeekly);
    playBeep(delta > 0 ? 1000 : 600, 0.05);
  };

  // Handlers for outcomes
  const handleToggleOutcome = (idx: number) => {
    const currentCompleted = weekly.completed_outcomes ? [...weekly.completed_outcomes] : [];
    const isCompleted = currentCompleted.includes(idx);
    const updatedCompleted = isCompleted 
      ? currentCompleted.filter(i => i !== idx)
      : [...currentCompleted, idx];
      
    const updatedWeekly = {
      ...weekly,
      completed_outcomes: updatedCompleted
    };
    
    setWeekly(updatedWeekly);
    setIsSavedLocally(false);
    saveWeeklyToStorage(updatedWeekly);
    playBeep(isCompleted ? 600 : 900, 0.06);
  };

  // Handlers for project status updates
  const handleStatusUpdate = (id: string, newStatus: Project["status"]) => {
    const updatedProjects = projects.map(p => {
      if (p.id === id) {
        let updatedNext = p.next_action;
        if (newStatus === "building" && p.next_action.includes("first operating screen")) {
          updatedNext = "Build out visual systems and layouts in Next.js.";
        }
        return { ...p, status: newStatus, next_action: updatedNext };
      }
      return p;
    });
    
    setProjects(updatedProjects);
    setIsSavedLocally(false);
    saveProjectsToStorage(updatedProjects);
    triggerSysLog(`LANE_STAGE_MOVE: ${id}`);
    playBeep(750, 0.08);
  };

  // Trigger Dagu workflow run from UI
  const runDagWorkflow = async (dagId: string) => {
    playBeep(980, 0.08);
    setBootLogs((prev) => [...prev, `[SYSTEM-CLI:~]$ dagu start ${dagId}`]);
    triggerSysLog("DAG_RUN_REQUESTED");
    
    try {
      // Try direct CORS fetch to local Dagu API
      const res = await fetch(`http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId)}/start`, {
        method: "POST"
      });
      if (res.ok) {
        setBootLogs((prev) => [...prev, `DAG SHIFT ACTIVE // "${dagId}" RUN STARTED [OK]`]);
        triggerSysLog("DAG_RUN_STARTED");
        return;
      }
    } catch (err) {
      console.warn("Direct CORS trigger failed", err);
    }
    
    // Fallback instructions for manual execution
    setBootLogs((prev) => [
      ...prev,
      `WARNING: API triggers offline. To run workflow, execute in terminal:`,
      `  dagu start ${dagId}`
    ]);
    triggerSysLog("DAG_RUN_FAILED");
  };

  const runAstraAnalysis = () => {
    if (astraAnalyzing) return;
    setAstraAnalyzing(true);
    setAstraReport([]);
    playBeep(980, 0.08);
    setBootLogs((prev) => [...prev, "[SYSTEM-CLI:~]$ astra analyze command-center"]);
    triggerSysLog("ASTRA_ANALYSIS_RUNNING");

    const steps = [
      "ACCESSING Command Center.md NOTE...",
      "EXTRACTING DECISION FILTERS MATRIX...",
      "VERIFYING 7 ACTIVE WORKSPACE PIPELINES...",
      "VALIDATING outcomes AND SYSTEM VECTOR DRIFT...",
      "ASTRA INFERENCE RESOLVED // SYNC COMPLETED."
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        playBeep(700 + idx * 80, 0.05);
        setAstraReport((prev) => [...prev, step]);
        if (idx === steps.length - 1) {
          setAstraAnalyzing(false);
          triggerSysLog("ASTRA_ANALYSIS_SUCCESS");
          speakMessage("Astra strategist analysis completed. All system vectors aligned with current mission: build Icyflamze brand through music signal.");
        }
      }, (idx + 1) * 800);
    });
  };

  // Handler for adding new idea
  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdea.name || !newIdea.next_action) return;

    setFormMsg("LOGGING CONCEPT NODE...");
    const id = newIdea.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const project: Project = {
      id,
      name: newIdea.name,
      lane: newIdea.lane,
      status: "concept",
      priority: "medium",
      next_action: newIdea.next_action,
      output: newIdea.output || "Obsidian brain note & concept"
    };

    setTimeout(() => {
      const updatedProjects = [...projects, project];
      setProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
      
      setNewIdea({ name: "", lane: "Labs", next_action: "", output: "" });
      setFormMsg("SUCCESS: CONCEPT LOGGED TO LOCAL VAULT");
      setIsSavedLocally(true);
      triggerSysLog("NODE_REGISTER_OK");
      playBeep(1100, 0.12);
      setTimeout(() => setFormMsg(""), 4000);
    }, 500);
  };

  const getLaneIcon = (lane: string) => {
    switch (lane.toLowerCase()) {
      case "labs": return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
      case "strategy": return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      case "media": return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case "tree groove records":
      case "music": return <Disc className="w-3.5 h-3.5 text-amber-400" />;
      default: return <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  // Radial progress calculations
  const totalOutcomes = weekly.outcomes.length || 1;
  const completedCount = weekly.completed_outcomes?.length || 0;
  const percentOutcomes = Math.round((completedCount / totalOutcomes) * 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentOutcomes / 100) * circumference;

  // Radar coordinates mapping
  const radarCenter = 100;
  const radarProjects = projects.map((p, idx) => {
    const angle = (idx * (360 / Math.max(projects.length, 1))) * (Math.PI / 180);
    const distance = 25 + (idx * 12) % 48; 
    const x = radarCenter + Math.cos(angle) * distance;
    const y = radarCenter + Math.sin(angle) * distance;
    return { ...p, x, y };
  });

  const selectedProjectObj = radarProjects.find(p => p.id === selectedRadarProject);

  return (
    <div 
      style={themeStyles[activeTheme] as React.CSSProperties}
      className={`min-h-screen bg-[#010204] text-slate-100 relative flex flex-col font-sans selection:bg-cyan-500/30 selection:text-slate-100 overflow-x-hidden tech-dot-matrix ${
        isCrtEnabled ? "crt-screen" : ""
      } ${isScanlineEnabled ? "animate-grid-sweep" : ""}`}
    >
      
      {/* Laser sweep line overlay */}
      {isScanlineEnabled && <div className="hud-scanline"></div>}

      {/* Rulers on margins */}
      <div className="absolute left-0 top-14 bottom-0 w-1.5 tech-ruler-y opacity-35 pointer-events-none"></div>
      <div className="absolute right-0 top-14 bottom-0 w-1.5 tech-ruler-y opacity-35 pointer-events-none"></div>
      
      <div className="fixed inset-0 pointer-events-none z-0 tech-subgrid opacity-40"></div>
      
      {/* HTML5 Canvas Background Particle Mesh */}
      <canvas id="hud-particle-canvas" className="fixed inset-0 pointer-events-none z-0 opacity-40"></canvas>
      
      {/* Space cockpit ambient gradients */}
      <div className="absolute top-1/4 left-1/4 w-[750px] h-[750px] bg-cyan-500/[0.04] rounded-full blur-[170px] pointer-events-none animate-pulse" aria-hidden="true" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[650px] h-[650px] bg-purple-500/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden="true"></div>

      {/* Top Floating Glassmorphic Status Bar */}
      <header className="border-b border-cyan-500/10 px-8 py-3.5 flex items-center justify-between text-[10px] font-mono tracking-widest text-slate-400 z-20 bg-slate-950/90 backdrop-blur-2xl sticky top-0">
        <div className="flex items-center gap-6">
          <Link 
            href="/"
            onClick={() => playBeep(500, 0.05)}
            className="flex items-center gap-2 px-3 py-1 border border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400 hover:bg-cyan-500/10 rounded-sm text-cyan-400 transition-all font-bold tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            VIRTUAL_SHELL
          </Link>
          <span className="text-cyan-500/20">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#06b6d4]"></span>
            <span className="text-slate-200 font-bold uppercase tracking-widest text-[9.5px]">TELEMETRY COCKPIT // FLIGHT_OS_PRO</span>
          </div>
          <span className="hidden xl:inline text-cyan-500/20">|</span>
          <span className="hidden xl:inline text-slate-500 font-bold">
            LAT: <span className="text-cyan-400 tracking-normal">{telemetry.lat.toFixed(5)}° N</span> // 
            LON: <span className="text-cyan-400 tracking-normal">{telemetry.lon.toFixed(5)}° E</span>
          </span>
        </div>
        
        {/* Toggle controls */}
        <div className="flex items-center gap-5">
          {/* Interactive Futuristic Theme Switcher */}
          <div className="flex items-center gap-1.5 border border-cyan-500/15 bg-cyan-950/10 rounded px-2.5 py-1 text-[8.5px]">
            <span className="text-slate-400 font-bold uppercase">THEME:</span>
            {(["neon", "solaris", "quantum"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  playBeep(980, 0.05);
                  setActiveTheme(t);
                  triggerSysLog(`THEME_SHIFT_${t.toUpperCase()}`);
                  setBootLogs((prev) => [...prev, `THEME CONFIG MODIFIED -> ${t.toUpperCase()}_CORE`]);
                }}
                className={`px-1.5 py-0.2 rounded font-black cursor-pointer uppercase text-[8px] tracking-wide transition-all ${
                  activeTheme === t
                    ? t === "neon" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : t === "solaris" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-transparent"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <span className="hidden md:inline text-cyan-500/20">|</span>

          {/* Speech Command Mic Activator */}
          <div className="flex items-center gap-2 border border-cyan-500/15 bg-cyan-950/10 rounded px-2.5 py-1 text-[8.5px]">
            <span className="text-slate-400 font-bold uppercase">MIC:</span>
            <button 
              onClick={startSpeechRecognition}
              className={`px-2 py-0.2 rounded font-black cursor-pointer uppercase transition-all duration-300 flex items-center gap-1.5 ${
                isListening 
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse font-black" 
                  : "bg-slate-900 text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-rose-400 animate-ping" : "bg-slate-500"}`}></span>
              {isListening ? "LISTENING..." : "LISTEN"}
            </button>
          </div>

          <span className="hidden md:inline text-cyan-500/20">|</span>

          <div className="flex items-center gap-2 border border-cyan-500/15 bg-cyan-950/10 rounded px-2.5 py-1 text-[8.5px]">
            <span className="text-slate-400 font-bold">CRT:</span>
            <button 
              onClick={() => { playBeep(880, 0.05); setIsCrtEnabled(!isCrtEnabled); }}
              className={`px-1.5 py-0.2 rounded font-black cursor-pointer uppercase ${
                isCrtEnabled ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-900 text-slate-600"
              }`}
            >
              {isCrtEnabled ? "ON" : "OFF"}
            </button>
            <span className="text-cyan-500/20">|</span>
            <span className="text-slate-400 font-bold">SWEEP:</span>
            <button 
              onClick={() => { playBeep(880, 0.05); setIsScanlineEnabled(!isScanlineEnabled); }}
              className={`px-1.5 py-0.2 rounded font-black cursor-pointer uppercase ${
                isScanlineEnabled ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-900 text-slate-600"
              }`}
            >
              {isScanlineEnabled ? "ON" : "OFF"}
            </button>
          </div>

          <span className="hidden md:inline text-cyan-500/20">|</span>
          
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className={isSavedLocally ? "text-cyan-400 font-semibold" : "text-rose-400 animate-pulse font-bold"}>
              {isSavedLocally ? "SECURE_SYNC" : "UNSAVED_CHANGES"}
            </span>
          </div>
        </div>
      </header>

      {/* Main HUD columns */}
      <main className="max-w-7xl mx-auto w-full px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative">
        
        {/* TOP ROW: Quad Dial gauges */}
        <section className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Dial 1: Radial directives calibrator */}
          <div className="glass-panel frame-corner clip-hud-card p-6 flex items-center justify-between shadow-xl relative overflow-hidden group border border-cyan-500/10">
            <div className="absolute top-1 left-3 text-[7.5px] font-mono text-cyan-500/40 uppercase tracking-widest">
              [CALIBRATION_COGNITIVE_SYSTEM]
            </div>
            
            <div className="flex flex-col space-y-2 mt-2">
              <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
                DIRECTIVES CALIBRATOR
              </span>
              <h3 className="text-[24px] font-display font-black text-white leading-none">
                {completedCount} <span className="text-cyan-500/30 text-[14px]">/</span> {totalOutcomes}
              </h3>
              <p className="text-[9px] font-mono text-slate-300 uppercase tracking-wider">
                {percentOutcomes}% RADAR SYNCED
              </p>
              <div className="text-[8px] font-mono text-slate-500">
                STATE: {percentOutcomes > 70 ? "OPTIMIZED_FLOW" : "TUNING_VECTOR"}
              </div>
            </div>

            {/* SVG Progress Circle */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/10 animate-spin" style={{ animationDuration: '20s' }}></div>
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r={radius} className="stroke-slate-900" strokeWidth="5" fill="transparent" style={{ cx: '40', cy: '40' }} />
                <circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  className="stroke-cyan-400 transition-all duration-1000 ease-out" 
                  strokeWidth="5" 
                  fill="transparent" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ cx: '40', cy: '40' }}
                />
              </svg>
              <div className="absolute text-[13px] font-mono font-black text-cyan-400">
                {percentOutcomes}%
              </div>
            </div>
          </div>

          {/* Dial 2: Wave oscilloscope */}
          <div className="glass-panel frame-corner clip-hud-card p-6 flex flex-col justify-between shadow-xl relative overflow-hidden border border-cyan-500/10">
            <div className="absolute top-1 left-3 text-[7.5px] font-mono text-purple-500/40 uppercase tracking-widest">
              [DIAGNOSTIC_OSCILLOSCOPE]
            </div>
            
            <div className="flex justify-between items-start mt-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-purple-400 tracking-wider uppercase font-semibold">
                  WORKSPACE MOD DELTA
                </span>
                <h3 className="text-[24px] font-display font-black text-white leading-none">
                  {(plr?.git_status?.dirty_count || 0).toString().padStart(2, "0")}
                </h3>
              </div>
              
              <span className={`px-2 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-widest font-black ${
                (plr?.git_status?.dirty_count || 0) > 0 
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" 
                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              }`}>
                {(plr?.git_status?.dirty_count || 0) > 0 ? "TRAFFIC_STRETCH" : "VAULT_CLEAN"}
              </span>
            </div>

            {/* Waveform graph SVG */}
            <div className="h-12 w-full mt-3 relative overflow-hidden bg-slate-950/80 border border-purple-500/15 rounded">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:8px_100%]"></div>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.025)_1px,transparent_1px)] bg-[size:100%_8px]"></div>
              <svg viewBox="0 0 400 60" className="w-full h-full">
                <defs>
                  <linearGradient id="sineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <path 
                  d={`M0,30 Q50,${15 + (plr?.git_status?.dirty_count || 0) * 2} 100,30 T200,30 T300,30 T400,30`} 
                  fill="none" 
                  stroke="url(#sineGrad)" 
                  strokeWidth="2.5" 
                  className="animate-pulse"
                />
              </svg>
            </div>
            
            <div className="flex justify-between text-[8.5px] font-mono text-slate-500 uppercase font-semibold">
              <span>AMP: {((plr?.git_status?.dirty_count || 0) + 1) * 1.5} MBPS</span>
              <span>INDEX: A-04</span>
            </div>
          </div>

          {/* Dial 3: Concentric project plotting radar with lock beam lines */}
          <div className="glass-panel frame-corner clip-hud-card p-5 flex items-center justify-between shadow-xl relative overflow-hidden border border-cyan-500/10">
            <div className="absolute top-1 left-3 text-[7.5px] font-mono text-cyan-500/40 uppercase tracking-widest">
              [CONCENTRIC_PROJECT_RADAR]
            </div>

            <div className="flex-1 flex flex-col space-y-1.5 mt-2 max-w-[125px]">
              <span className="text-[9.5px] font-mono text-cyan-400 uppercase tracking-wider font-semibold leading-none">
                COORDINATES LOCK
              </span>
              <div className="h-0.5 w-8 bg-cyan-500/30"></div>
              {selectedProjectObj ? (
                <div className="space-y-0.5 font-mono text-[9px] leading-tight">
                  <p className="text-white truncate font-black uppercase text-[9.5px]">{selectedProjectObj.name}</p>
                  <p className="text-purple-400 uppercase font-bold text-[8px]">LANE: {selectedProjectObj.lane}</p>
                  <p className="text-slate-400 uppercase text-[8px]">STATUS: {selectedProjectObj.status}</p>
                  <p className="text-rose-400 uppercase text-[7.5px] font-semibold">RANGE: {Math.abs(selectedProjectObj.x * 0.4 + selectedProjectObj.y * 0.6).toFixed(1)} AU</p>
                  <p className="text-cyan-400 uppercase text-[7.5px] font-semibold">SIGNAL: {Math.round(100 - (selectedProjectObj.x + selectedProjectObj.y) / 5)}%</p>
                </div>
              ) : (
                <p className="text-[8.5px] font-mono text-slate-500 leading-normal uppercase">
                  Select a coordinate dot to lock target vector logs.
                </p>
              )}
            </div>

            {/* Radar component */}
            <div className="w-28 h-28 relative flex items-center justify-center border border-cyan-500/10 rounded-full bg-slate-950/40 shadow-inner">
              <div className="absolute w-24 h-24 rounded-full border border-cyan-500/5"></div>
              <div className="absolute w-16 h-16 rounded-full border border-cyan-500/5"></div>
              <div className="absolute w-8 h-8 rounded-full border border-cyan-500/5"></div>
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[1px] border-b border-dashed border-cyan-500/5"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-full w-[1px] border-l border-dashed border-cyan-500/5"></div>
              </div>

              {/* Sweep Scan Line */}
              <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-300"
                style={{ transform: `rotate(${radarAngle}deg)` }}
              >
                <div className="w-1/2 h-full border-r border-cyan-400/25 bg-gradient-to-l from-cyan-400/[0.06] to-transparent origin-right scale-y-100"></div>
              </div>

              {/* Vector dots and Lock laser line */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full z-10 cursor-crosshair">
                {/* Draw crosshair coordinate axes targeting current locked node */}
                {selectedProjectObj && (
                  <>
                    <line x1="0" y1={selectedProjectObj.y} x2="200" y2={selectedProjectObj.y} stroke="rgba(244,63,94,0.25)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={selectedProjectObj.x} y1="0" x2={selectedProjectObj.x} y2="200" stroke="rgba(244,63,94,0.25)" strokeWidth="1" strokeDasharray="3 3" />
                    <circle cx={selectedProjectObj.x} cy={selectedProjectObj.y} r="10" fill="none" stroke="#f43f5e" strokeWidth="1" className="animate-ping" />
                    <circle cx={selectedProjectObj.x} cy={selectedProjectObj.y} r="6" fill="none" stroke="#f43f5e" strokeWidth="1" />
                    <line 
                      x1={radarCenter} 
                      y1={radarCenter} 
                      x2={selectedProjectObj.x} 
                      y2={selectedProjectObj.y} 
                      stroke="#f43f5e" 
                      strokeWidth="2.5" 
                      strokeDasharray="4 4" 
                      className="animate-pulse"
                    />
                  </>
                )}
                
                {radarProjects.map((project) => {
                  const isSelected = selectedRadarProject === project.id;
                  let color = "#06b6d4";
                  if (project.status === "shipped") color = "#10b981";
                  else if (project.status === "building") color = "#8b5cf6";
                  else if (project.status === "draft") color = "#f43f5e";

                  return (
                    <circle 
                      key={project.id}
                      cx={project.x}
                      cy={project.y}
                      r={isSelected ? 6.5 : 4}
                      fill={color}
                      className="cursor-pointer transition-all duration-300 hover:scale-150 hover:brightness-125"
                      onClick={() => {
                        playBeep(isSelected ? 600 : 980, 0.06);
                        setSelectedRadarProject(isSelected ? null : project.id);
                      }}
                      onMouseEnter={() => {
                        playBeep(880, 0.03);
                        setSelectedRadarProject(project.id);
                      }}
                      style={{ filter: isSelected ? 'drop-shadow(0 0 5px currentColor)' : '' }}
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Dial 4: Cockpit Sound & Voice Deck */}
          <div className="glass-panel frame-corner clip-hud-card p-5 flex flex-col justify-between shadow-xl relative overflow-hidden border border-cyan-500/10 min-h-[175px]">
            <div className="absolute top-1 left-3 text-[7.5px] font-mono text-cyan-500/40 uppercase tracking-widest">
              [AUDIO_SOUNDBOARD_&_VOICE_GATEWAY]
            </div>

            <div className="flex justify-between items-start mt-2">
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase font-semibold">
                  ACOUSTIC CABIN CONSOLE
                </span>
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest">
                  SYNTH MODULATORS: ACTIVE
                </span>
              </div>

              {/* Cabin Hum drone toggle */}
              <button
                onClick={toggleCabinDrone}
                className={`px-2 py-0.5 border rounded-sm font-mono text-[8px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                  isDroneActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse"
                    : "bg-slate-900/60 text-slate-500 border-slate-800"
                }`}
              >
                DRONE: {isDroneActive ? "ON" : "OFF"}
              </button>
            </div>

            {/* Playable soundboard keys */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: "BOOT", type: "boot" as const, color: "hover:bg-cyan-500/15 hover:text-cyan-400 border-cyan-500/20" },
                { label: "RADAR", type: "radar" as const, color: "hover:bg-purple-500/15 hover:text-purple-400 border-purple-500/20" },
                { label: "SHIELD", type: "shield" as const, color: "hover:bg-pink-500/15 hover:text-pink-400 border-pink-500/20" },
                { label: "ALERT", type: "alert" as const, color: "hover:bg-rose-500/15 hover:text-rose-400 border-rose-500/20" }
              ].map((sound) => (
                <button
                  key={sound.label}
                  onClick={() => playSoundEffect(sound.type)}
                  className={`py-1 text-[8.5px] border font-mono rounded-sm transition-all duration-300 font-bold bg-slate-950/40 text-slate-400 ${sound.color} cursor-pointer uppercase`}
                >
                  {sound.label}
                </button>
              ))}
            </div>

            {/* Equalizer animation visualizer lines */}
            <div className="h-6 flex items-end justify-center gap-1.5 bg-slate-950/70 border border-cyan-500/10 rounded px-3 py-1 mt-2.5 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => {
                const randomDelay = (i * 0.15).toFixed(2);
                return (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-t-sm transition-all"
                    style={{
                      height: speechActive ? "100%" : isDroneActive ? "60%" : "20%",
                      animation: speechActive || isDroneActive 
                        ? `eq-bounce ${0.6 + (i % 3) * 0.25}s ease-in-out infinite alternate` 
                        : "none",
                      animationDelay: `${randomDelay}s`,
                      backgroundColor: speechActive 
                        ? "var(--sn-accent)" 
                        : "var(--sn-primary)"
                    }}
                  />
                );
              })}
            </div>

            <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase font-semibold mt-1">
              <span>AUDIO CONTEXT: OK</span>
              <span>SYNAPSE: {speechActive ? "TRANSMITTING" : "STANDBY"}</span>
            </div>
          </div>

        </section>

        {/* LEFT SECTION (Col 8): Operations HUD, Checklists, Lanes */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Custom Pipeline Grid connection matrix */}
          <div className="glass-panel frame-corner clip-hud-card p-6 space-y-6 shadow-xl relative border border-cyan-500/10">
            <div className="flex justify-between items-center pb-3 border-b border-cyan-500/15 text-[9px] font-mono">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '20s' }} />
                <span className="text-slate-200 font-bold uppercase tracking-wider">PIPELINE CONTROL COMMAND</span>
              </div>
              <span className="text-cyan-400 font-bold">PROCESS_VECTOR: SECURE</span>
            </div>

            {/* Stage counters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {["concept", "draft", "building", "shipped"].map((status, index) => {
                const statusProjects = projects.filter(p => p.status === status);
                
                let textTone = "text-cyan-400";
                let bgTone = "bg-cyan-500/5 border-cyan-500/20";
                let dotTone = "bg-cyan-400";
                if (status === "shipped") {
                  textTone = "text-emerald-400";
                  bgTone = "bg-emerald-500/5 border-emerald-500/20";
                  dotTone = "bg-emerald-400";
                } else if (status === "building") {
                  textTone = "text-purple-400";
                  bgTone = "bg-purple-500/5 border-purple-500/20";
                  dotTone = "bg-purple-400";
                } else if (status === "draft") {
                  textTone = "text-rose-400";
                  bgTone = "bg-rose-500/5 border-rose-500/20";
                  dotTone = "bg-rose-400";
                }

                return (
                  <div key={status} className={`border rounded-lg p-3.5 flex flex-col justify-between min-h-[95px] relative overflow-hidden ${bgTone}`}>
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-white/10"></div>
                    <div className="flex items-center justify-between text-[8px] font-mono uppercase tracking-widest text-slate-400">
                      <span>PH_0{index + 1}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${dotTone} animate-pulse`}></span>
                    </div>
                    
                    <div className="my-2">
                      <span className={`text-[10px] font-mono font-black uppercase tracking-wider ${textTone}`}>
                        {status}
                      </span>
                      <h4 className="text-[22px] font-display font-black text-white leading-none">
                        {statusProjects.length.toString().padStart(2, "0")}
                      </h4>
                    </div>

                    <div className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                      ACTIVE SYSTEM NODES
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage listings with layout animation */}
            <div className="space-y-4 pt-2">
              <AnimatePresence mode="popLayout">
                {projects.map((project) => {
                  let accentBorder = "border-cyan-500/10 hover:border-cyan-500/25";
                  let badgeClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/25";
                  const isHighlighted = selectedRadarProject === project.id;
                  
                  if (project.status === "shipped") {
                    accentBorder = "border-emerald-500/10 hover:border-emerald-500/25";
                    badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
                  } else if (project.status === "building") {
                    accentBorder = "border-purple-500/10 hover:border-purple-500/25";
                    badgeClass = "bg-purple-500/10 text-purple-400 border-purple-500/25";
                  } else if (project.status === "draft") {
                    accentBorder = "border-rose-500/10 hover:border-rose-500/25";
                    badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/25";
                  }

                  return (
                    <motion.div 
                      layoutId={project.id}
                      key={project.id} 
                      className={`p-4 border rounded-lg bg-slate-950/60 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isHighlighted ? "border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20 bg-cyan-950/10" : accentBorder
                      }`}
                    >
                      <div className="space-y-2 max-w-xl font-mono text-[10px]">
                        <div className="flex flex-wrap items-center gap-2 text-[8px]">
                          <div className="flex items-center gap-1 bg-slate-900 border border-cyan-500/10 rounded px-1.5 py-0.5">
                            {getLaneIcon(project.lane)}
                            <span className="uppercase text-slate-300 font-bold">{project.lane}</span>
                          </div>
                          
                          <span className={`px-1.5 py-0.5 rounded border uppercase tracking-widest font-black ${badgeClass}`}>
                            {project.status.toUpperCase()}
                          </span>

                          <span className={`px-1.5 py-0.5 rounded border bg-transparent ${
                            project.priority === "high" 
                              ? "text-rose-400 border-rose-500/20" 
                              : "text-slate-500 border-slate-800"
                          }`}>
                            {project.priority.toUpperCase()}_PRIORITY
                          </span>
                        </div>
                        
                        <h4 className="font-display font-black text-white uppercase text-[12px] tracking-wide">
                          {project.name}
                        </h4>
                        
                        <div className="space-y-1 pl-3 border-l-2 border-cyan-500/20 text-[9.5px]">
                          <p className="text-slate-300 leading-relaxed">
                            <span className="text-cyan-400 font-bold uppercase mr-1.5">IMMEDIATE_ACTION:</span> 
                            {project.next_action}
                          </p>
                          <p className="text-slate-400">
                            <span className="uppercase mr-1.5">OUTPUT_TARGET:</span> 
                            {project.output}
                          </p>
                        </div>
                      </div>

                      {/* Promoters */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center text-[9px] mt-2 sm:mt-0 font-mono">
                        {project.status !== "concept" && (
                          <button 
                            onClick={() => handleStatusUpdate(project.id, project.status === "shipped" ? "building" : project.status === "building" ? "draft" : "concept")}
                            className="px-2.5 py-1 border border-cyan-500/20 rounded bg-slate-950 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all cursor-pointer uppercase font-bold"
                          >
                            ← BACK
                          </button>
                        )}
                        {project.status !== "shipped" && (
                          <button 
                            onClick={() => handleStatusUpdate(project.id, project.status === "concept" ? "draft" : project.status === "draft" ? "building" : "shipped")}
                            className="px-2.5 py-1 border border-purple-500/30 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-slate-950 transition-all duration-300 font-bold cursor-pointer uppercase shadow-sm"
                          >
                            ADVANCE →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Weekly outcomes directives */}
          <div className="glass-panel frame-corner clip-hud-card p-6 space-y-4 shadow-xl border border-cyan-500/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-cyan-500/10">
              <span className="text-[10px] font-mono text-slate-400 tracking-[0.15em] uppercase flex items-center gap-2 font-bold">
                <CheckSquare className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                WEEKLY OUTCOMES DIRECTIVES
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-2.5 py-0.5 font-bold uppercase tracking-wider">
                COMPLETED: {completedCount} / {totalOutcomes}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 font-mono text-[10px]">
              {weekly.outcomes.map((outcome, idx) => {
                const isCompleted = weekly.completed_outcomes?.includes(idx);
                const orderNumber = (idx + 1).toString().padStart(2, "0");
                return (
                  <div 
                    key={idx}
                    onClick={() => handleToggleOutcome(idx)}
                    onMouseEnter={() => playBeep(980, 0.02)}
                    className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all duration-300 ${
                      isCompleted 
                        ? "border-emerald-500/20 bg-emerald-500/[0.02] text-slate-500 line-through" 
                        : "border-cyan-500/5 bg-slate-950/40 hover:border-cyan-500/25 hover:bg-cyan-500/[0.02]"
                    }`}
                  >
                    <div className="flex-shrink-0 text-cyan-400 text-[8px] border border-cyan-500/20 rounded px-1.5 py-0.2 bg-slate-900 font-bold">
                      VECTOR_{orderNumber}
                    </div>
                    
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-black">[✓]</span>
                      ) : (
                        <span className="text-slate-600 hover:text-cyan-400 transition-colors font-black">[ ]</span>
                      )}
                    </div>
                    
                    <span className={`leading-relaxed ${isCompleted ? "opacity-50" : "text-slate-200"}`}>{outcome}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Astra Strategic Briefing Deck */}
          <div className="glass-panel frame-corner clip-hud-card p-6 space-y-4 shadow-xl border border-cyan-500/10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b border-cyan-500/10">
              <span className="text-[10px] font-mono text-slate-300 tracking-[0.15em] uppercase flex items-center gap-2 font-bold">
                <Sparkles className="w-4.5 h-4.5 text-purple-400 animate-spin" style={{ animationDuration: '10s' }} />
                [ASTRA_STRATEGY_DECISION_DECK]
              </span>
              <button
                onClick={runAstraAnalysis}
                disabled={astraAnalyzing}
                className={`px-3 py-1 border text-[8.5px] font-mono font-bold tracking-wider rounded uppercase cursor-pointer transition-all duration-300 ${
                  astraAnalyzing
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400 animate-pulse cursor-not-allowed"
                    : "border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-slate-950 shadow-sm"
                }`}
              >
                {astraAnalyzing ? "ANALYZING..." : "RUN STRATEGIC CHECK"}
              </button>
            </div>

            {/* Current Mission briefing */}
            <div className="bg-slate-950/60 border border-purple-500/10 rounded-lg p-4 font-mono text-[9.5px] space-y-2">
              <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest block">
                CURRENT STRATEGIC MISSION BRIEFING:
              </span>
              <p className="text-slate-200 leading-relaxed uppercase">
                "Build ICYFLAMZE The Brilliantaire into a creative technology and cultural systems brand with music as a public signal, not the whole ceiling."
              </p>
            </div>

            {/* Decision Filters checklist */}
            <div className="space-y-2.5">
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                CORE SYSTEM DECISION FILTER FRAMEWORK:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Does it strengthen the identity?",
                  "Does it create proof?",
                  "Does it create audience, money, leverage, or learning?",
                  "Can it become a reusable system?",
                  "Does it align with the Brilliantaire mission?"
                ].map((filter, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border border-cyan-500/5 bg-slate-950/30 rounded-lg hover:border-purple-500/20 transition-colors">
                    <span className="text-purple-400 font-black flex-shrink-0 mt-0.5">[✓]</span>
                    <span className="font-mono text-[9px] text-slate-300 uppercase leading-normal">{filter}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Astra Analysis Terminal Feed */}
            {astraReport.length > 0 && (
              <div className="bg-black border border-purple-500/15 p-3 rounded font-mono text-[8.5px] text-purple-400 space-y-1 max-h-[100px] overflow-y-auto leading-relaxed">
                {astraReport.map((line, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-purple-500/30">[{new Date().toLocaleTimeString()}]</span>
                    <span className={index === astraReport.length - 1 && astraAnalyzing ? "animate-pulse text-white font-bold" : ""}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION (Col 4): Multi-Tab System Command Terminal & Trackers */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Multi-Tab Terminal Panel */}
          <div className="glass-panel frame-corner clip-hud-card overflow-hidden flex flex-col shadow-xl border border-cyan-500/10">
            
            {/* Terminal cockpit Tabs */}
            <div className="flex border-b border-cyan-500/15 bg-slate-950/80 font-mono text-[9px]">
              <button 
                onClick={() => { playBeep(880, 0.05); setTerminalTab("logs"); }} 
                className={`flex-1 py-3 text-center border-r border-cyan-500/10 cursor-pointer transition-all ${
                  terminalTab === "logs" 
                    ? "bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-b-cyan-400" 
                    : "text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                [01_LOGS]
              </button>
              
              <button 
                onClick={() => { playBeep(880, 0.05); setTerminalTab("changes"); }} 
                className={`flex-1 py-3 text-center border-r border-cyan-500/10 cursor-pointer transition-all ${
                  terminalTab === "changes" 
                    ? "bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-b-cyan-400" 
                    : "text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                [02_CHECK]
              </button>
              
              <button 
                onClick={() => { playBeep(880, 0.05); setTerminalTab("capture"); }} 
                className={`flex-1 py-3 text-center border-r border-cyan-500/10 cursor-pointer transition-all ${
                  terminalTab === "capture" 
                    ? "bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-b-cyan-400" 
                    : "text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                [03_CAPTURE]
              </button>

              <button 
                onClick={() => { playBeep(880, 0.05); setTerminalTab("vnp"); }} 
                className={`flex-1 py-3 text-center cursor-pointer transition-all ${
                  terminalTab === "vnp" 
                    ? "bg-cyan-500/10 text-cyan-400 font-bold border-b-2 border-b-cyan-400" 
                    : "text-slate-400 hover:bg-slate-900/40"
                }`}
              >
                [04_VOICE]
              </button>
            </div>

            {/* Tab content viewports */}
            <div className="p-5 min-h-[400px] bg-slate-950/70 font-mono text-[10px] flex flex-col justify-between">
              
              {/* Tab 1: Compiler logs & Interactive Shell CLI Prompt */}
              {terminalTab === "logs" && (
                <div className="space-y-4 flex flex-col justify-between h-full flex-1">
                  <div className="space-y-3 flex-1 flex flex-col justify-between">
                    
                    {/* Diagnostic boots & user console feed */}
                    <div className="space-y-1 bg-black border border-cyan-500/10 p-2.5 rounded text-[8px] text-cyan-400/90 h-[170px] overflow-y-auto leading-relaxed select-all">
                      <div className="text-[7.5px] text-cyan-500/40 border-b border-cyan-500/10 pb-1 mb-1 font-bold">
                        SYSTEMBOOT_DIAGNOSTICS_SHELL:
                      </div>
                      {bootLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-cyan-500/30">[{new Date().toLocaleTimeString()}]</span>
                          <span className={log.startsWith("[SYSTEM-CLI:~]") ? "text-cyan-300 font-bold" : idx === bootLogs.length - 1 ? "text-white animate-pulse" : ""}>
                            {log}
                          </span>
                        </div>
                      ))}
                      <div className="w-1 h-3 bg-cyan-400 inline-block animate-pulse ml-1"></div>
                    </div>

                    {/* Interactive CLI Console Input Form */}
                    <form onSubmit={handleCommandSubmit} className="flex gap-2 border-t border-cyan-500/10 pt-2">
                      <span className="text-cyan-400 font-bold self-center text-[9px]">[SYSTEM-DECK:~]$</span>
                      <input 
                        type="text" 
                        value={cmdInput}
                        onChange={(e) => setCmdInput(e.target.value)}
                        placeholder="Type command (/help)..." 
                        className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-cyan-300 text-[9.5px] font-mono placeholder-cyan-800"
                      />
                    </form>

                    <div className="flex justify-between items-center pb-1.5 border-b border-cyan-500/5 text-[9px] pt-1">
                      <span className="text-slate-400 uppercase font-bold">STDOUT READ:</span>
                      <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase ${
                        plr?.build?.success 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {plr?.build?.success ? "SUCCESS" : "FAIL"}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 border border-cyan-500/5 p-3 rounded max-h-[80px] overflow-y-auto scrollbar-thin text-slate-300 whitespace-pre-wrap select-all">
                      {plr?.build?.stdout || "No compilations logged."}
                    </div>
                  </div>

                  {plr?.preview_path && (
                    <div className="pt-3 border-t border-cyan-500/10 flex items-center justify-between gap-3 bg-slate-900/20 p-2.5 rounded-sm">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-widest">
                        LIVE SURFACE
                      </span>
                      <a 
                        href={plr.preview_path}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => playBeep(1100, 0.08)}
                        className="inline-flex items-center gap-1.5 text-[9.5px] font-black text-cyan-400 hover:text-white transition-all duration-300 border border-cyan-500/30 hover:border-cyan-400 rounded px-3.5 py-1.5 bg-cyan-500/5 hover:bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                      >
                        <Globe className="w-3 h-3 text-cyan-400" />
                        LAUNCH COCKPIT SURFACE
                        <ExternalLink className="w-2.5 h-2.5 text-cyan-400" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Workspace check */}
              {terminalTab === "changes" && (
                <div className="space-y-4 flex flex-col justify-between h-full flex-1">
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    <div className="flex justify-between items-center pb-2 border-b border-cyan-500/5 text-[9px]">
                      <span className="text-slate-400 uppercase font-bold">MODIFIED CHANNELS:</span>
                      <span className="text-purple-400 font-bold">COUNT: {plr?.git_status?.dirty_count || 0}</span>
                    </div>

                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {plr?.git_status?.changes && plr.git_status.changes.length > 0 ? (
                        plr.git_status.changes.map((change: string, idx: number) => {
                          const statusLetter = change.trim().substring(0, 2).trim();
                          const fileName = change.trim().substring(2).trim();
                          const isModified = statusLetter === "M";
                          const isUntracked = statusLetter === "??";
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 p-1.5 border border-slate-900 bg-slate-900/40 rounded-sm text-[9px]">
                              <span className={`w-7 text-center font-bold px-1 rounded-sm text-[8px] uppercase ${
                                isModified 
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                                  : isUntracked 
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {isModified ? "MOD" : isUntracked ? "NEW" : "DEL"}
                              </span>
                              <span className="text-slate-300 truncate flex-1" title={fileName}>
                                {fileName}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-slate-500 text-[8.5px] uppercase">
                          No modified file coordinates detected.
                        </div>
                      )}
                    </div>

                    {plr && plr.git_status && plr.git_status.dirty_count > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[8.5px] text-purple-400 uppercase font-bold tracking-wider">
                          SAVE TARGET LINE:
                        </span>
                        
                        <div className="relative border border-cyan-500/10 rounded overflow-hidden bg-slate-950">
                          <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1 border-b border-cyan-500/10 text-[8px] text-slate-400">
                            <span>TERMINAL_LINE_HELPER</span>
                            <button 
                              type="button"
                              onClick={() => handleCopy(`git -C ${plr.path} add .\ngit -C ${plr.path} commit -m "checkpoint: ${plr.lane_name} build verified"`)}
                              className="text-[8px] text-cyan-400 hover:text-white transition-colors bg-transparent border border-cyan-500/20 rounded px-1.5 py-0.2 cursor-pointer font-bold"
                            >
                              {copiedText || "COPY"}
                            </button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-[9px] text-slate-200 select-all cursor-pointer hover:bg-white/[0.01]"
                               onClick={() => handleCopy(`git -C ${plr.path} add .\ngit -C ${plr.path} commit -m "checkpoint: ${plr.lane_name} build verified"`)}>
                            $ git -C {plr.path} add .
                            <br />
                            $ git -C {plr.path} commit -m "checkpoint"
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Capture form */}
              {terminalTab === "capture" && (
                <form onSubmit={handleAddIdea} className="space-y-4 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                        NODE IDENTIFIER NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={newIdea.name}
                        onChange={(e) => setNewIdea({ ...newIdea, name: e.target.value })}
                        placeholder="Identify concept node..."
                        className="w-full bg-slate-900 border border-cyan-500/10 focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(6,182,212,0.15)] px-3 py-2 text-slate-200 focus:outline-none rounded-md text-[10px] font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                          SYSTEM LANE
                        </label>
                        <select
                          value={newIdea.lane}
                          onChange={(e) => setNewIdea({ ...newIdea, lane: e.target.value })}
                          className="w-full bg-slate-900 border border-cyan-500/10 focus:border-cyan-400 px-2 py-1.5 text-slate-300 focus:outline-none rounded-md text-[9px] cursor-pointer font-mono"
                        >
                          <option value="Labs">Labs</option>
                          <option value="Strategy">Strategy</option>
                          <option value="Media">Media</option>
                          <option value="Tree Groove Records">Tree Groove</option>
                          <option value="Academy">Academy</option>
                          <option value="Ventures">Ventures</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                          OUTPUT TARGET
                        </label>
                        <input
                          type="text"
                          value={newIdea.output}
                          onChange={(e) => setNewIdea({ ...newIdea, output: e.target.value })}
                          placeholder="e.g. app mockup"
                          className="w-full bg-slate-900 border border-cyan-500/10 focus:border-cyan-400 px-2.5 py-1.5 text-slate-300 focus:outline-none rounded-md text-[9px] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                        IMMEDIATE ACTION DIRECTION
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={newIdea.next_action}
                        onChange={(e) => setNewIdea({ ...newIdea, next_action: e.target.value })}
                        placeholder="Define immediate trajectory action vector..."
                        className="w-full bg-slate-900 border border-cyan-500/10 focus:border-cyan-400 px-3 py-2 text-slate-200 focus:outline-none rounded-md resize-none text-[9.5px] font-mono"
                      ></textarea>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-extrabold uppercase tracking-[0.15em] transition-all duration-300 rounded-md cursor-pointer text-[9px] shadow-[0_4px_12px_rgba(6,182,212,0.2)]"
                    >
                      LOG NODE_CONCEPT TO VAULT
                    </button>

                    {formMsg && (
                      <div className={`p-2 border rounded text-[9px] leading-relaxed text-center font-bold uppercase ${
                        formMsg.includes("ERROR") 
                          ? "border-rose-500/25 bg-rose-500/5 text-rose-400" 
                          : formMsg.includes("LOGGING")
                          ? "border-cyan-500/25 bg-cyan-500/5 text-cyan-400 animate-pulse"
                          : "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
                      }`}>
                        {formMsg}
                      </div>
                    )}
                  </div>
                </form>
              )}

              {/* Tab 4: Voice synapse announcer */}
              {terminalTab === "vnp" && (
                <div className="space-y-4 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    <label className="block text-[8px] text-slate-400 uppercase tracking-widest mb-1.5 font-bold">
                      COCKPIT VOCAL SYNAPSE BROADCASTER
                    </label>
                    <p className="text-[9px] text-slate-400 leading-relaxed uppercase">
                      Stream custom speech patterns directly into the cockpit voice synth channel.
                    </p>
                    
                    <div className="relative">
                      <textarea
                        rows={3}
                        id="vnp-speech-input"
                        placeholder="Type standard announcement synapses..."
                        className="w-full bg-slate-900 border border-cyan-500/10 focus:border-cyan-400 px-3 py-2 text-slate-200 focus:outline-none rounded-md resize-none text-[9.5px] font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById("vnp-speech-input") as HTMLTextAreaElement;
                          if (textarea && textarea.value.trim()) {
                            speakMessage(textarea.value.trim());
                            setBootLogs(prev => [...prev, `VOCAL BROADCAST SENT -> "${textarea.value.trim()}"`]);
                            textarea.value = "";
                          }
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-extrabold uppercase tracking-[0.12em] transition-all duration-300 rounded-md cursor-pointer text-[9px]"
                      >
                        TRANSMIT SYNAPSE SPEECH [OK]
                      </button>

                      <button
                        type="button"
                        onClick={startSpeechRecognition}
                        className={`px-3 py-2 border rounded-md font-mono text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer ${
                          isListening
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse font-black"
                            : "bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-600"
                        }`}
                      >
                        {isListening ? "LISTENING" : "TALK TO HUD"}
                      </button>
                    </div>

                    {/* Speech Quick macros */}
                    <div className="grid grid-cols-1 gap-1.5 pt-1.5 border-t border-cyan-500/10">
                      <span className="text-[7.5px] text-slate-500 uppercase tracking-wider block font-bold">SPEECH PRESET MACROS:</span>
                      {[
                        { label: "[SYSTEM STANDBY]", text: "Sovereign One System OS, standing by in cockpit sector 4." },
                        { label: "[SCAN COMPLETED]", text: "Matrix coordinates scanning complete. All pipeline operations secure." },
                        { label: "[BUILD VERIFIED]", text: "Code compiler build successfully compiled and deployed to file preview targets." }
                      ].map((macro) => (
                        <button
                          key={macro.label}
                          type="button"
                          onClick={() => {
                            speakMessage(macro.text);
                            setBootLogs(prev => [...prev, `MACRO VOCAL SHIFT -> ${macro.label}`]);
                          }}
                          className="w-full text-left py-1 px-2 border border-cyan-500/5 hover:border-cyan-500/25 bg-slate-950/40 text-slate-400 hover:text-cyan-400 rounded-sm text-[8.5px] font-mono transition-all duration-300 cursor-pointer uppercase"
                        >
                          {macro.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Diagnostics D: Blinking CPU Core Grid + Voice Signal equalizers */}
          <div className="glass-panel frame-corner clip-hud-card p-5 space-y-4 shadow-xl border border-cyan-500/10">
            <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10 text-[9.5px] font-mono">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300 font-bold uppercase tracking-wider">HARDWARE CORE MATRIX</span>
              </div>
              <span className="text-rose-400 text-[8.5px] font-black uppercase tracking-wider">
                TEMP: {telemetry.temp.toFixed(1)}°C
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 4x4 CPU cores */}
              <div className="space-y-1.5">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest block">CPU THREAD MATRIX:</span>
                <div className="grid grid-cols-4 gap-1 p-1.5 border border-cyan-500/10 bg-slate-950/40 rounded-sm w-fit">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const activeIndex = (i % 3) + 1;
                    const isBlinking = (i * 7) % 5 > 1;
                    return (
                      <div 
                        key={i} 
                        className={`w-3.5 h-3.5 rounded-sm transition-all duration-500 ${
                          isBlinking ? `cpu-core-active-${activeIndex}` : "bg-slate-900"
                        }`}
                        title={`Core ${i + 1}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Fan spinner */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <span className="text-[7.5px] font-mono text-slate-500 uppercase tracking-widest block">COOLING ENGINE:</span>
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-cyan-400 animate-spin-slow" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                    <path d="M50 50 L50 15 A10 10 0 0 1 60 25 Z" fill="currentColor" />
                    <path d="M50 50 L85 50 A10 10 0 0 1 75 60 Z" fill="currentColor" />
                    <path d="M50 50 L50 85 A10 10 0 0 1 40 75 Z" fill="currentColor" />
                    <path d="M50 50 L15 50 A10 10 0 0 1 25 40 Z" fill="currentColor" />
                    <circle cx="50" cy="50" r="6" fill="#02040a" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <div className="font-mono text-[8px] text-slate-400 space-y-0.5">
                    <p className="text-cyan-400 font-bold">RPM: 3200</p>
                    <p className="uppercase text-slate-500">STATE: NOMINAL</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-[8px] font-mono text-slate-500 uppercase font-semibold">
              <span>THREADS: 16/16 OK</span>
              <span>AUDIO ROUTE: SPEECH_API</span>
            </div>
          </div>

          {/* Dagu Scheduler & Multi-DAG Summary */}
          <div className="glass-panel frame-corner clip-hud-card p-5 space-y-4 shadow-xl border border-cyan-500/10">
            <div className="flex justify-between items-center pb-2.5 border-b border-cyan-500/10 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300 font-bold uppercase tracking-wider">DAG SCHEDULER MATRIX</span>
              </div>
              <span className="text-emerald-400 text-[8.5px] font-black border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/5 uppercase tracking-widest">
                ACTIVE
              </span>
            </div>

            <div className="text-[9.5px] font-mono space-y-2 max-h-[120px] overflow-y-auto pr-1">
              {mr?.dagu?.summary?.map((summaryItem: string, idx: number) => {
                const isSuccess = summaryItem.includes("succeeded") || summaryItem.includes("running");
                const name = summaryItem.split(":")[0] || "dag";
                const status = summaryItem.split(":")[1]?.trim() || "unknown";
                
                return (
                  <div key={idx} className="flex justify-between items-center gap-2 p-2 border border-slate-900 bg-slate-950/45 rounded-sm">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-slate-300 font-bold truncate max-w-[140px] uppercase">
                        {name}
                      </span>
                      <span className="text-[7.5px] text-slate-500 truncate max-w-[140px] leading-tight">
                        {status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.2 rounded-sm text-[8px] font-bold uppercase tracking-widest ${
                        isSuccess 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                      }`}>
                        {isSuccess ? "ACTIVE" : "ERROR"}
                      </span>
                      
                      <button
                        onClick={() => runDagWorkflow(name)}
                        className="px-2 py-0.5 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded text-[7.5px] font-bold tracking-wider cursor-pointer uppercase transition-all"
                      >
                        RUN
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Rhythm Operational Timeline */}
          <div className="glass-panel frame-corner clip-hud-card p-5 shadow-xl border border-cyan-500/10">
            <div className="flex items-center gap-2 pb-2.5 border-b border-cyan-500/10 mb-4">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-300 tracking-[0.15em] uppercase font-bold">
                DAILY TIMELINE ROUTINES
              </span>
            </div>

            <div className="space-y-2 font-mono text-[9px]">
              {daysOfWeek.map((day) => {
                const isCurrent = day.num === currentDayNum;
                return (
                  <div 
                    key={day.num}
                    onClick={() => playBeep(800, 0.04)}
                    className={`p-3 border rounded-lg relative transition-all duration-300 cursor-pointer ${
                      isCurrent 
                        ? "border-cyan-500/40 bg-cyan-950/30 text-white shadow-[0_0_12px_rgba(6,182,212,0.15)] font-bold" 
                        : "border-cyan-500/5 bg-slate-950/30 text-slate-400 hover:border-cyan-500/10"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`uppercase text-[9px] tracking-wider ${isCurrent ? "text-cyan-400" : "text-slate-200"}`}>
                        {day.label}
                      </span>
                      <span className={`text-[8px] px-1.5 border rounded ${isCurrent ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" : "border-slate-800 text-slate-500 bg-white/2"}`}>
                        {day.code}
                      </span>
                    </div>
                    <p className="leading-relaxed text-[9.5px]">
                      {day.task}
                    </p>
                    {isCurrent && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#06b6d4]"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution Metrics Panel */}
          <div className="glass-panel frame-corner clip-hud-card p-5 shadow-xl border border-cyan-500/10">
            <div className="flex items-center gap-2 pb-2.5 border-b border-cyan-500/10 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono text-slate-300 tracking-[0.15em] uppercase font-bold">
                WEEKLY METRIC METERS
              </span>
            </div>

            <div className="space-y-4 font-mono text-[9px]">
              {(Object.keys(weekly.metrics) as Array<keyof WeeklyData["metrics"]>).map((key) => {
                const value = weekly.metrics[key];
                const cleanLabel = key.replace(/_/g, " ").toUpperCase();
                
                return (
                  <div key={key} className="space-y-2 border-b border-slate-900 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between text-slate-400">
                      <span className="font-bold uppercase tracking-wider">{cleanLabel}</span>
                      <span className="text-cyan-400 font-bold tracking-wider">
                        {value.toString().padStart(2, "0")} / 05
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      {/* Premium segmented linear bar */}
                      <div className="flex gap-1 flex-1 bg-slate-950 border border-cyan-500/10 p-0.5 rounded-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-1.5 flex-1 rounded-sm transition-all duration-500 ${
                              i < value 
                                ? "bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]" 
                                : "bg-slate-900/30"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Control buttons */}
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleMetricChange(key, -1)}
                          className="w-5 h-5 flex items-center justify-center border border-cyan-500/10 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-100 rounded transition-all cursor-pointer font-bold"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <button 
                          onClick={() => handleMetricChange(key, 1)}
                          className="w-5 h-5 flex items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 rounded transition-all duration-300 cursor-pointer font-bold shadow-sm"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
