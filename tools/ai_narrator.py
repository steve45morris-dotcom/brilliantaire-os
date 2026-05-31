#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║     Brilliantaire OS — AI Narrator Module                        ║
║     tools/ai_narrator.py                                         ║
╚══════════════════════════════════════════════════════════════════╝

Reads system telemetry JSON, calls Gemini to generate a plain-language
narrative, then routes output to:
  1. outputs/narrator_card.json  → Dashboard Overview card
  2. brilliantaire-briefs/latest_task_explain.md → Obsidian vault

Usage:
    python tools/ai_narrator.py                        # Narrate latest state
    python tools/ai_narrator.py --state path/to.json  # Custom state file
    python tools/ai_narrator.py --dry-run              # Print only, no writes
    python tools/ai_narrator.py --watch                # Auto-run on state change
"""

import os
import sys
import json
import time
import hashlib
import argparse
from datetime import datetime
from pathlib import Path

try:
    import google.generativeai as genai
except ImportError:
    print("Missing: pip install google-generativeai")
    sys.exit(1)

# ─── Config ───────────────────────────────────────────────────────────────────

# Load API key from environment, fallback to ~/.zsh_secrets
API_KEY         = os.environ.get("GEMINI_API_KEY", "")
if not API_KEY:
    secrets_path = Path(os.path.expanduser("~/.zsh_secrets"))
    if secrets_path.exists():
        for line in secrets_path.read_text().splitlines():
            if "GEMINI_API_KEY=" in line:
                API_KEY = line.split("GEMINI_API_KEY=")[1].strip('"\'')

MODEL           = "gemini-2.5-flash"
MAX_TOKENS      = 1000

# Paths
STATE_FILE      = Path(os.environ.get("BRILL_STATE_FILE",  "./outputs/system_state.json"))
NARRATOR_CARD   = Path(os.environ.get("BRILL_CARD_FILE",   "./outputs/narrator_card.json"))
OBSIDIAN_DIR    = Path(os.environ.get("BRILL_OBSIDIAN_DIR","./brilliantaire-briefs"))
OBSIDIAN_NOTE   = OBSIDIAN_DIR / "latest_task_explain.md"
EXPLAIN_HISTORY = Path("./outputs/explain_history.md")
LOG_DIR         = Path("./logs")
LOG_FILE        = LOG_DIR / f"ai_narrator_{datetime.now().strftime('%Y-%m-%d')}.log"

WATCH_INTERVAL  = 8   # seconds between state polls in --watch mode

# ─── System Prompt (copy-pasteable — also exported below) ─────────────────────

NARRATOR_SYSTEM_PROMPT = """You are the Brilliantaire OS Mission Narrator — an embedded AI briefing layer inside a sovereign, mesh-networked operating system called Brilliantaire OS.

Your sole job is to read raw system telemetry JSON and translate it into three sections of clear, plain-language narrative. You write for a 15-year-old who is technically curious but not yet an engineer. No jargon without explanation. No bullet walls. No corporate filler.

You always output ONLY valid JSON — no markdown fences, no preamble, no explanation outside the JSON object. Every response must match this exact schema:

{
  "timestamp": "<ISO 8601 timestamp>",
  "headline": "<One punchy sentence summarizing the system moment — max 12 words>",
  "what_we_did": "<2-4 sentences. What tasks, commands, or events just completed. Plain English. Past tense.>",
  "what_it_is": "<2-4 sentences. What the system IS and what it is FOR right now. Present tense. Explain any technical term you use in the same sentence.>",
  "whats_left": "<2-4 sentences. What the next important moves are and why they matter. Future tense. Be specific, not vague.>",
  "status_color": "<one of: green | yellow | red — green = all healthy, yellow = partial issues, red = critical failure>",
  "mood": "<one of: nominal | advancing | degraded | critical>",
  "key_metrics": {
    "active_tenants": "<number or unknown>",
    "mesh_nodes_live": "<X/Y format or unknown>",
    "mrr_usd": "<dollar amount or unknown>",
    "consensus_status": "<achieved | failed | pending | unknown>",
    "last_action": "<short label of most recent completed task>"
  }
}

Rules:
- Never output anything outside the JSON object.
- Never use technical acronyms without defining them inline.
- Never be vague in whats_left — name the actual next step.
- If a field value is genuinely unknown from the telemetry, write the string "unknown".
- Keep each narrative section under 80 words.
- Write with confidence and clarity. You are a trusted briefing officer, not a chatbot."""

# ─── Logging ──────────────────────────────────────────────────────────────────

LOG_DIR.mkdir(parents=True, exist_ok=True)

def log(level: str, msg: str):
    ts   = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] [{level}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

# ─── State Loader ────────────────────────────────────────────────────────────

def load_state(path: Path) -> dict:
    """Load system state JSON. Returns empty dict if missing."""
    if not path.exists():
        log("WARN", f"State file not found: {path} — using empty state")
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as e:
        log("ERR", f"Invalid JSON in state file: {e}")
        return {}

def state_hash(state: dict) -> str:
    return hashlib.md5(json.dumps(state, sort_keys=True).encode()).hexdigest()

# ─── Gemini Call ──────────────────────────────────────────────────────────────

def narrate(state: dict) -> dict:
    """Send telemetry to Gemini, return parsed narrative dict."""

    user_prompt = f"""Here is the current Brilliantaire OS system telemetry snapshot. Read it and produce your narrative JSON output now.

TELEMETRY:
{json.dumps(state, indent=2)}

Current UTC time: {datetime.utcnow().isoformat()}

Respond with ONLY the JSON object. No markdown. No explanation."""

    log("RUN", "Calling Gemini narrator...")
    try:
        model = genai.GenerativeModel(MODEL, system_instruction=NARRATOR_SYSTEM_PROMPT)
        response = model.generate_content(user_prompt)
        raw = response.text.strip()

        # Strip accidental fences
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        # Extract JSON block if there's text around it
        if "{" in raw and "}" in raw:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            raw = raw[start:end]

        parsed = json.loads(raw)
        log("OK", f"Narrative generated — mood: {parsed.get('mood','?')} | status: {parsed.get('status_color','?')}")
        return parsed

    except json.JSONDecodeError as e:
        log("ERR", f"Gemini returned invalid JSON: {e}")
        log("ERR", f"Raw: {raw[:300]}")
        return {}
    except Exception as e:
        log("ERR", f"Gemini call failed: {e}")
        return {}

# ─── Writers ──────────────────────────────────────────────────────────────────

def write_dashboard_card(narrative: dict):
    """Write narrator_card.json for the dashboard Overview card."""
    NARRATOR_CARD.parent.mkdir(parents=True, exist_ok=True)
    NARRATOR_CARD.write_text(json.dumps(narrative, indent=2))
    log("OK", f"Dashboard card written → {NARRATOR_CARD}")

def write_obsidian_note(narrative: dict):
    """Write/overwrite latest_task_explain.md in the Obsidian vault."""
    OBSIDIAN_DIR.mkdir(parents=True, exist_ok=True)

    ts      = datetime.now().strftime("%Y-%m-%d %H:%M")
    mood    = narrative.get("mood", "unknown").upper()
    color   = narrative.get("status_color", "unknown")
    metrics = narrative.get("key_metrics", {})

    color_emoji = {"green": "🟢", "yellow": "🟡", "red": "🔴"}.get(color, "⚪")

    note = f"""# 🧭 Brilliantaire OS — Mission Brief
*Generated: {ts} | Status: {color_emoji} {color.upper()} | Mood: {mood}*

---

## Headline
{narrative.get('headline', '—')}

## What We Did
{narrative.get('what_we_did', '—')}

## What It Is
{narrative.get('what_it_is', '—')}

## What's Left
{narrative.get('whats_left', '—')}

---

## Key Metrics
| Metric | Value |
|--------|-------|
| Active Tenants | {metrics.get('active_tenants', '—')} |
| Mesh Nodes Live | {metrics.get('mesh_nodes_live', '—')} |
| MRR (USD) | {metrics.get('mrr_usd', '—')} |
| Consensus | {metrics.get('consensus_status', '—')} |
| Last Action | {metrics.get('last_action', '—')} |

---
*Brilliantaire OS AI Narrator · {ts}*
"""
    OBSIDIAN_NOTE.write_text(note)
    log("OK", f"Obsidian note written → {OBSIDIAN_NOTE}")

    # Append to history
    EXPLAIN_HISTORY.parent.mkdir(parents=True, exist_ok=True)
    with open(EXPLAIN_HISTORY, "a") as f:
        f.write(f"\n---\n\n## {ts} — {narrative.get('headline','')}\n\n")
        f.write(f"**Did:** {narrative.get('what_we_did','')}\n\n")
        f.write(f"**Is:** {narrative.get('what_it_is','')}\n\n")
        f.write(f"**Next:** {narrative.get('whats_left','')}\n\n")
    log("OK", f"History appended → {EXPLAIN_HISTORY}")

def print_narrative(narrative: dict):
    """Pretty-print narrative to terminal."""
    color_code = {"green":"\033[92m","yellow":"\033[93m","red":"\033[91m"}.get(
        narrative.get("status_color",""), "\033[0m")
    reset = "\033[0m"
    cyan  = "\033[96m"
    bold  = "\033[1m"
    dim   = "\033[2m"

    print(f"\n{bold}{cyan}{'═'*60}{reset}")
    print(f"{bold}{cyan}  ⬡ BRILLIANTAIRE OS — MISSION BRIEF{reset}")
    print(f"{cyan}{'═'*60}{reset}")
    print(f"\n{bold}  {narrative.get('headline','')}{reset}\n")
    print(f"{color_code}  ● STATUS: {narrative.get('status_color','?').upper()} | MOOD: {narrative.get('mood','?').upper()}{reset}\n")
    print(f"{bold}  WHAT WE DID{reset}")
    print(f"  {narrative.get('what_we_did','')}\n")
    print(f"{bold}  WHAT IT IS{reset}")
    print(f"  {narrative.get('what_it_is','')}\n")
    print(f"{bold}  WHAT'S LEFT{reset}")
    print(f"  {narrative.get('whats_left','')}\n")

    m = narrative.get("key_metrics", {})
    print(f"{dim}  Tenants: {m.get('active_tenants','?')}  |  Nodes: {m.get('mesh_nodes_live','?')}  |  MRR: {m.get('mrr_usd','?')}  |  Consensus: {m.get('consensus_status','?')}{reset}")
    print(f"{cyan}{'═'*60}{reset}\n")

# ─── Watch Mode ───────────────────────────────────────────────────────────────

def watch_mode(state_path: Path, dry_run: bool):
    log("MODE", f"Watch mode active — polling {state_path} every {WATCH_INTERVAL}s")
    last_hash = ""
    while True:
        try:
            state = load_state(state_path)
            h = state_hash(state)
            if h != last_hash:
                log("INFO", "State change detected — narrating...")
                narrative = narrate(state)
                if narrative:
                    print_narrative(narrative)
                    if not dry_run:
                        write_dashboard_card(narrative)
                        write_obsidian_note(narrative)
                last_hash = h
            time.sleep(WATCH_INTERVAL)
        except KeyboardInterrupt:
            log("STOP", "Watch mode stopped.")
            break

# ─── Entry Point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Brilliantaire OS — AI Narrator")
    parser.add_argument("--state",   type=Path, default=STATE_FILE, help="Path to system state JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print narrative only — no file writes")
    parser.add_argument("--watch",   action="store_true", help="Poll state file and re-narrate on change")
    parser.add_argument("--print-prompt", action="store_true", help="Print the system prompt and exit")
    args = parser.parse_args()

    if args.print_prompt:
        print(NARRATOR_SYSTEM_PROMPT)
        return

    if not API_KEY:
        log("ERR", "GEMINI_API_KEY not set. Export it or define it in ~/.zsh_secrets and retry.")
        sys.exit(1)

    genai.configure(api_key=API_KEY)

    if args.watch:
        watch_mode(args.state, args.dry_run)
        return

    state     = load_state(args.state)
    narrative = narrate(state)

    if not narrative:
        log("ERR", "Narration failed — check logs.")
        sys.exit(1)

    print_narrative(narrative)

    if not args.dry_run:
        write_dashboard_card(narrative)
        write_obsidian_note(narrative)
    else:
        log("DRY", "Dry run — no files written.")

if __name__ == "__main__":
    main()
