#!/usr/bin/env python3
"""Voice Vibe: tiny macOS screen companion for Claude voice hooks."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

HOME = Path.home()
SCRIPTS_DIR = HOME / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))
from voice_authority import (  # noqa: E402
    set_mode as authority_set_mode,
    status as authority_status,
)
VOICE_DIR = HOME / ".claude" / "voice"
CONF_PATH = VOICE_DIR / "voice.conf"
STATE_PATH = Path("/tmp/.claude_voice_state.json")
PUBLIC_STATE_PATH = HOME / "Landing Page Sites" / "supernova" / "supernova-command" / "the-one-system-ui" / "public" / "voice-vibe-state.json"
REPORTING_MARKER = Path("/tmp/.claude_voice_reporting")
SHOW_MARKER = Path("/tmp/.claude_voice_show")
MASTER_MUTE_MARKER = Path("/tmp/.supernova_voice_muted")
INTELLIGENCE_STATE_PATH = Path("/tmp/.supernova_voice_intelligence.json")
VIBEVOICE_STATE_PATH = Path("/tmp/.vibevoice_worker_state.json")
LIVE_STATE_PATH = Path("/tmp/.supernova_live_voice.json")
VOICE_BUFFER_PATH = HOME / ".agents" / "voice_buffer.txt"
MUTED_ARCHIVE_DIR = HOME / ".agents" / "muted_voice_reports"
WATCHDOG_STATE_PATH = Path("/tmp/.supernova_watchdog.json")
LOG_PATH_DEFAULT = Path("/tmp/.claude_voice_log.txt")
LEDGER_PATH_DEFAULT = HOME / "Documents" / "Alexander OS" / "03 Workflows" / "Voice Vibe Ledger.md"
UI_STATE_PATH = VOICE_DIR / "voice-vibe-ui.json"
BRIEFING_READER = HOME / "Backend Services" / "orchestrators" / "supernova-observer" / "supernova_voice.py"
ACTIVATION_SOUND = Path("/System/Library/Sounds/Glass.aiff")
ACTIVATION_GREETING = (
    "Welcome back, Commander. "
    "Supernova is online. "
    "Core systems are standing by, and I'm ready for your command."
)
ACTIVATION_VOICE = "Samantha"
ACTIVATION_RATE = 158

DEFAULTS = {
    "ENABLED": "true",
    "PROFILE": "build",
    "STYLE": "icy",
    "LOG_PATH": str(LOG_PATH_DEFAULT),
    "VOICE_REPORT_POLICY": "strict",
    "VOICE_ALLOW_EVENTS": "guardrail,stop_file,verify_fail,verify_pass,audit_complete,taskcard,escalated,checkpoint,deploy,blocker,error",
    "VOICE_SPEAK_USER_TEXT": "false",
    "VOICE_LEDGER_PATH": str(LEDGER_PATH_DEFAULT),
    "VOICE_QUIET_START": "22:00",
    "VOICE_QUIET_END": "08:00",
    "VOICE_DIGEST_SIZE": "3",
    "VOICE_DIGEST_MAX_WAIT_SECONDS": "300",
    "VOICE_DUPLICATE_WINDOW_HOURS": "24",
    "VIBEVOICE_TIMEOUT": "45",
    "VOICE_FALLBACK_MODE": "none",
    "ACTIVATION_VOICE": ACTIVATION_VOICE,
    "ACTIVATION_RATE": str(ACTIVATION_RATE),
    "ACTIVATION_GREETING": ACTIVATION_GREETING,
    "LIVE_ENABLED": "false",
    "LIVE_VISION_ENABLED": "false",
    "LIVE_HISTORY_ENABLED": "true",
    "LIVE_WAKE_PHRASE": "Hello Supernova",
    "LIVE_GEMINI_VOICE": "Kore",
    "LIVE_RESPONSE_STYLE": "warm, concise, and action-oriented",
    "LIVE_OFFLINE_FALLBACK": "vibevoice",
    "LIVE_NOISE_GATE_RMS": "280",
    "LIVE_NOISE_ADAPTATION_RATE": "0.08",
    "LIVE_VISION_ALLOWED_WINDOWS": "Visual Studio Code,Obsidian,Terminal",
}

INTELLIGENCE_DEFAULTS = {
    "queue_size": 0,
    "digest_size": 0,
    "expired_count": 0,
    "filtered_count": 0,
    "duplicate_count": 0,
    "last_spoken": "",
    "last_rejection_reason": "",
    "quiet_hours_active": False,
    "next_digest_reason": "empty",
}

WORKER_DEFAULTS = {
    "vibevoice_status": "offline",
    "vibevoice_queue_depth": 0,
    "vibevoice_load_ms": None,
    "vibevoice_generation_ms": None,
    "vibevoice_last_error": "",
    "vibevoice_last_played_at": "",
}

LIVE_DEFAULTS = {
    "live_status": "dormant",
    "live_detail": "",
    "live_transcript": "",
    "live_response_transcript": "",
    "live_error": "",
    "live_vision_enabled": False,
    "live_history_enabled": False,
    "live_wake_phrase": "Hello Supernova",
    "live_reconnect_count": 0,
    "live_audio_chunks_sent": 0,
    "live_interruptions": 0,
    "live_latency_ms": 0,
    "live_vision_capture_active": False,
    "live_sovereign_mode": "cloud",
    "live_cloud_circuit_open": False,
    "live_acoustic_threshold_rms": 0,
    "live_acoustic_noise_floor_rms": 0,
    "live_mission_store_enabled": False,
}


def request_show(marker: Path = SHOW_MARKER) -> None:
    marker.write_text(str(int(time.time())))


def consume_show_request(marker: Path = SHOW_MARKER) -> bool:
    if not marker.exists():
        return False
    try:
        marker.unlink()
    except OSError:
        return False
    return True


def read_watchdog_state(path: Path = WATCHDOG_STATE_PATH) -> dict[str, object]:
    if not path.exists():
        return {}
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def read_intelligence_state(path: Path = INTELLIGENCE_STATE_PATH) -> dict[str, object]:
    state = dict(INTELLIGENCE_DEFAULTS)
    if not path.exists():
        return state
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return state
    if isinstance(value, dict):
        for key in state:
            if key in value:
                state[key] = value[key]
    return state


def read_worker_state(path: Path = VIBEVOICE_STATE_PATH) -> dict[str, object]:
    state = dict(WORKER_DEFAULTS)
    if not path.exists():
        return state
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return state
    if not isinstance(value, dict):
        return state
    mapping = {
        "status": "vibevoice_status",
        "queue_depth": "vibevoice_queue_depth",
        "load_ms": "vibevoice_load_ms",
        "last_generation_ms": "vibevoice_generation_ms",
        "last_error": "vibevoice_last_error",
        "last_played_at": "vibevoice_last_played_at",
    }
    for source, target in mapping.items():
        if source in value:
            state[target] = value[source]
    return state


def read_live_state(path: Path = LIVE_STATE_PATH) -> dict[str, object]:
    state = dict(LIVE_DEFAULTS)
    value = read_json_object(path)
    mapping = {
        "status": "live_status",
        "detail": "live_detail",
        "transcript": "live_transcript",
        "response_transcript": "live_response_transcript",
        "error": "live_error",
        "vision_enabled": "live_vision_enabled",
        "history_enabled": "live_history_enabled",
        "wake_phrase": "live_wake_phrase",
        "reconnect_count": "live_reconnect_count",
        "audio_chunks_sent": "live_audio_chunks_sent",
        "interruptions": "live_interruptions",
        "latest_latency_ms": "live_latency_ms",
        "vision_capture_active": "live_vision_capture_active",
        "sovereign_mode": "live_sovereign_mode",
        "cloud_circuit_open": "live_cloud_circuit_open",
        "acoustic_threshold_rms": "live_acoustic_threshold_rms",
        "acoustic_noise_floor_rms": "live_acoustic_noise_floor_rms",
        "mission_store_enabled": "live_mission_store_enabled",
    }
    for source, target in mapping.items():
        if source in value:
            raw = value[source]
            state[target] = str(raw)[-240:] if isinstance(raw, str) else raw
    return state


def read_json_object(path: Path) -> dict[str, object]:
    if not path.exists():
        return {}
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    return value if isinstance(value, dict) else {}


def source_age_label(raw_timestamp: object) -> str:
    if not raw_timestamp:
        return "NO SOURCE TIME"
    try:
        if isinstance(raw_timestamp, (int, float)):
            source_time = datetime.fromtimestamp(float(raw_timestamp)).astimezone()
        else:
            source_time = datetime.fromisoformat(str(raw_timestamp).replace("Z", "+00:00"))
            if source_time.tzinfo is None:
                source_time = source_time.astimezone()
        seconds = max(0, int((datetime.now().astimezone() - source_time).total_seconds()))
    except (TypeError, ValueError, OSError):
        return "SOURCE TIME INVALID"
    if seconds < 60:
        return f"{seconds}S AGO"
    if seconds < 3600:
        return f"{seconds // 60}M AGO"
    return f"{seconds // 3600}H AGO"


def visual_state(state: dict[str, object]) -> str:
    if not state.get("enabled"):
        return "off"
    live_status = str(state.get("live_status", "dormant")).lower()
    if live_status in {
        "connecting",
        "listening",
        "thinking",
        "speaking",
        "interrupted",
        "error",
        "local",
    }:
        return live_status
    worker_status = str(state.get("vibevoice_status", "")).lower()
    if worker_status in {"busy", "warming"}:
        return "thinking"
    if state.get("reporting"):
        return "speaking"
    mode = str(state.get("mode", "on"))
    if mode in {"warning", "celebration", "focus", "silent", "watching"}:
        return mode
    if int(state.get("queue_size", 0) or 0) > 0:
        return "listening"
    return "on"


def trust_summary(state: dict[str, object]) -> tuple[str, str, str]:
    reason = str(state.get("last_rejection_reason", "") or "")
    if reason:
        decision = f"BLOCKED: {reason.replace('_', ' ').upper()}"
    elif state.get("reporting"):
        decision = "ALLOWED: LIVE REPORT"
    elif state.get("enabled"):
        decision = "READY: POLICY WATCHING"
    else:
        decision = "BLOCKED: MASTER OFF"
    source_age = source_age_label(state.get("last_source_at") or state.get("authority_updated_at"))
    counts = (
        f"STALE {int(state.get('expired_count', 0) or 0)}  "
        f"DUP {int(state.get('duplicate_count', 0) or 0)}  "
        f"FILTERED {int(state.get('filtered_count', 0) or 0)}"
    )
    return decision, source_age, counts


def watchdog_summary(state: dict[str, object]) -> str:
    labels = {
        "voice_vibe": "PANEL",
        "voice_bridge": "BRIDGE",
        "supernova_intel": "INTEL",
        "supernova_matrix": "MATRIX",
        "memory_engine": "MEMORY",
    }
    for key, label in labels.items():
        item = state.get(key)
        if isinstance(item, dict) and item.get("status") not in {"online", "recovering"}:
            return f"{label} ERROR"
    online = sum(
        1
        for key in labels
        if isinstance(state.get(key), dict)
        and state[key].get("status") in {"online", "recovering"}
    )
    return f"SYSTEMS {online}/{len(labels)}"


def read_config() -> dict[str, str]:
    config = dict(DEFAULTS)
    if not CONF_PATH.exists():
        return config
    for raw in CONF_PATH.read_text(errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        config[key.strip()] = value.strip().strip('"').strip("'")
    return config


def write_config(updates: dict[str, str]) -> None:
    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    lines = []
    seen = set()
    if CONF_PATH.exists():
        for raw in CONF_PATH.read_text(errors="ignore").splitlines():
            if raw.strip() and not raw.lstrip().startswith("#") and "=" in raw:
                key = raw.split("=", 1)[0].strip()
                if key in updates:
                    lines.append(f"{key}={updates[key]}")
                    seen.add(key)
                    continue
            lines.append(raw)
    for key, value in updates.items():
        if key not in seen:
            lines.append(f"{key}={value}")
    CONF_PATH.write_text("\n".join(lines).rstrip() + "\n")
    update_state()


def current_state() -> dict[str, object]:
    config = read_config()
    enabled = config.get("ENABLED", "false").lower() == "true"
    profile = config.get("PROFILE", "build").lower()
    reporting = False
    if REPORTING_MARKER.exists():
        try:
            raw = REPORTING_MARKER.read_text(errors="ignore").strip().splitlines()[0]
            started = int(raw) if raw.isdigit() else int(REPORTING_MARKER.stat().st_mtime)
            reporting = time.time() - started < 35
        except (OSError, ValueError, IndexError):
            reporting = False
        if not reporting:
            try:
                REPORTING_MARKER.unlink()
            except OSError:
                pass
    log_path = Path(config.get("LOG_PATH", str(LOG_PATH_DEFAULT))).expanduser()
    last_log = ""
    if log_path.exists():
        try:
            lines = log_path.read_text(errors="ignore").splitlines()
            last_log = lines[-1] if lines else ""
        except OSError:
            last_log = ""
    mode = state_mode(enabled, reporting, profile, last_log)
    state = {
        "enabled": enabled,
        "profile": profile,
        "reporting": reporting,
        "mode": mode,
        "mood": mode,
        "policy": config.get("VOICE_REPORT_POLICY", "strict"),
        "speak_user_text": config.get("VOICE_SPEAK_USER_TEXT", "false").lower() == "true",
        "allowed_events": [
            item.strip()
            for item in config.get("VOICE_ALLOW_EVENTS", "").split(",")
            if item.strip()
        ],
        "updated_at": int(time.time()),
        "last_log": last_log[-220:],
    }
    state.update(read_intelligence_state())
    state.update(read_worker_state())
    state.update(read_live_state())
    authority = authority_status()
    state["enabled"] = authority["enabled"]
    state["mode"] = authority["mode"] if authority["mode"] == "off" else state["mode"]
    state["max_source_age_hours"] = authority["max_source_age_hours"]
    state["authority_updated_at"] = authority.get("updated_at", "")
    state["last_source_at"] = authority.get("last_allowed_at", "")
    state["last_source_text"] = authority.get("last_text", "")
    live_status = str(state.get("live_status", "dormant"))
    if state["enabled"] and live_status not in {"dormant", "muted"}:
        state["mode"] = live_status
        state["mood"] = live_status
    state["visual_state"] = visual_state(state)
    return state


def state_mode(enabled: bool, reporting: bool, profile: str, last_log: str) -> str:
    last_lower = last_log.lower()
    if not enabled:
        return "off"
    if reporting:
        return "reporting"
    if profile == "focus":
        return "focus"
    if profile == "silent":
        return "silent"
    if "policy_muted" in last_lower:
        return "watching"
    if any(word in last_lower for word in ("guardrail", "verify_fail", "error", "blocked", "blocker")):
        return "warning"
    if any(word in last_lower for word in ("verify_pass", "checkpoint", "deploy", "completed")):
        return "celebration"
    return "on"


def update_state() -> dict[str, object]:
    state = current_state()
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")
    try:
        PUBLIC_STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
        PUBLIC_STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")
    except OSError:
        pass
    return state


def archive_pending_reports(
    buffer_path: Path = VOICE_BUFFER_PATH,
    archive_dir: Path = MUTED_ARCHIVE_DIR,
) -> Path | None:
    try:
        if not buffer_path.exists() or buffer_path.stat().st_size == 0:
            return None
        reports = buffer_path.read_text(errors="ignore")
        if not reports:
            return None
        archive_dir.mkdir(parents=True, exist_ok=True)
        archive_path = archive_dir / f"{time.strftime('%Y-%m-%d')}.log"
        with archive_path.open("a") as archive:
            archive.write(reports)
            if not reports.endswith("\n"):
                archive.write("\n")
        buffer_path.write_text("")
        return archive_path
    except OSError:
        return None


def set_on() -> None:
    archive_pending_reports()
    authority_set_mode("on")
    update_state()
    print("Voice Vibe: ON")


def stop_current_narration() -> None:
    for process_name in ("say", "afplay"):
        subprocess.run(
            ["/usr/bin/killall", process_name],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def set_off() -> None:
    authority_set_mode("off")
    write_config({"LIVE_ENABLED": "false"})
    archive_pending_reports()
    update_state()
    print("Voice Vibe: OFF / dormant")


def set_silent() -> None:
    authority_set_mode("silent")
    write_config({"LIVE_ENABLED": "false"})
    update_state()
    print("Voice Vibe: ON / silent profile")


def set_profile(profile: str) -> None:
    if profile == "focus":
        authority_set_mode("focus")
        write_config({"LIVE_ENABLED": "false"})
    else:
        authority_set_mode("on")
        write_config({"ENABLED": "true", "PROFILE": profile})
    update_state()
    print(f"Voice Vibe: ON / {profile} profile")


def set_live_on() -> None:
    authority_set_mode("on")
    write_config({"LIVE_ENABLED": "true"})
    update_state()
    print("Voice Vibe Live: ON / connecting")


def set_live_off() -> None:
    stop_current_narration()
    write_config({"LIVE_ENABLED": "false"})
    update_state()
    print("Voice Vibe Live: OFF / dormant")


def set_live_vision(enabled: bool) -> None:
    write_config({"LIVE_VISION_ENABLED": "true" if enabled else "false"})
    print(f"Voice Vibe Live Vision: {'ON' if enabled else 'OFF'}")


def set_policy(policy: str) -> None:
    write_config({"VOICE_REPORT_POLICY": policy})
    print(f"Voice Vibe policy: {policy}")


def set_user_text(value: bool) -> None:
    write_config({"VOICE_SPEAK_USER_TEXT": "true" if value else "false"})
    print(f"Voice Vibe user-text speech: {'allowed' if value else 'muted'}")


def print_status() -> None:
    state = update_state()
    label = {
        "reporting": "REPORTING",
        "on": "ON",
        "off": "OFF / dormant",
        "watching": "ON / watching",
        "focus": "ON / focus",
        "silent": "ON / silent",
        "warning": "ON / warning",
        "celebration": "ON / celebration",
    }.get(str(state["mode"]), str(state["mode"]))
    print(f"Voice Vibe: {label}")
    print(f"Profile: {state['profile']}")
    print(f"Policy: {state['policy']}")
    print(f"User text: {'allowed' if state['speak_user_text'] else 'muted'}")
    if state.get("last_log"):
        print(f"Last log: {state['last_log']}")
    print(f"Live: {str(state.get('live_status', 'dormant')).upper()}")


def notify(message: str) -> None:
    try:
        subprocess.run(
            [
                "osascript",
                "-e",
                f'display notification "{message}" with title "Voice Vibe"',
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        pass


def play_activation_sound(sound_path: Path = ACTIVATION_SOUND) -> bool:
    if not sound_path.exists():
        return False
    try:
        subprocess.Popen(
            ["/usr/bin/afplay", str(sound_path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        return False
    return True


def speak_activation_greeting(
    greeting: str | None = None,
    voice: str | None = None,
    rate: int | None = None,
) -> bool:
    config = read_config()
    if greeting is None:
        greeting = config.get("ACTIVATION_GREETING", ACTIVATION_GREETING)
    if voice is None:
        voice = config.get("ACTIVATION_VOICE", ACTIVATION_VOICE)
    if rate is None:
        try:
            rate = int(config.get("ACTIVATION_RATE", str(ACTIVATION_RATE)))
        except ValueError:
            rate = ACTIVATION_RATE
    rate = min(max(rate, 120), 210)
    if not greeting.strip():
        return False
    try:
        subprocess.Popen(
            ["/usr/bin/say", "-v", voice, "-r", str(rate), greeting],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        return False
    return True


def run_gui() -> None:
    import tkinter as tk

    root = tk.Tk()
    root.title("Voice Vibe")
    root.configure(bg="#101116")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    width, height = 286, 458
    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    ui_state = read_json_object(UI_STATE_PATH)
    start_x = int(ui_state.get("x", max(20, screen_w - width - 28)))
    start_y = int(ui_state.get("y", 76))
    root.geometry(f"{width}x{height}+{start_x}+{start_y}")

    canvas = tk.Canvas(root, width=width, height=112, bg="#101116", highlightthickness=0, cursor="hand2")
    canvas.pack(fill="x")
    title = tk.Label(root, text="Voice Vibe", fg="#f8f5ea", bg="#101116", font=("Menlo", 13, "bold"))
    title.pack()
    subtitle = tk.Label(root, text="", fg="#8d93a5", bg="#101116", font=("Menlo", 10))
    subtitle.pack(pady=(1, 7))
    system_status = tk.Label(root, text="SYSTEMS --/5", fg="#4cc9f0", bg="#101116", font=("Menlo", 9, "bold"))
    system_status.pack(pady=(0, 5))
    intelligence_status = tk.Label(
        root,
        text="QUEUE 0 | DIGEST 0",
        fg="#8d93a5",
        bg="#101116",
        font=("Menlo", 8, "bold"),
    )
    intelligence_status.pack(pady=(0, 5))
    live_status_label = tk.Label(
        root,
        text="LIVE DORMANT",
        fg="#5f6573",
        bg="#101116",
        font=("Menlo", 8, "bold"),
    )
    live_status_label.pack(pady=(0, 5))
    bubble = tk.Label(
        root,
        text="Standing by.",
        fg="#f8f5ea",
        bg="#1a1c23",
        justify="left",
        anchor="w",
        wraplength=254,
        font=("Menlo", 8),
        padx=9,
        pady=7,
    )
    bubble.pack(fill="x", padx=10, pady=(2, 7))

    trust_frame = tk.Frame(root, bg="#0b0c10", highlightbackground="#2a2d38", highlightthickness=1)
    trust_frame.pack(fill="x", padx=10, pady=(0, 7))
    trust_title = tk.Label(
        trust_frame,
        text="TRUST MONITOR",
        fg="#4cc9f0",
        bg="#0b0c10",
        font=("Menlo", 8, "bold"),
        anchor="w",
    )
    trust_title.pack(fill="x", padx=8, pady=(6, 1))
    trust_decision = tk.Label(trust_frame, text="", fg="#65f4a6", bg="#0b0c10", font=("Menlo", 8), anchor="w")
    trust_decision.pack(fill="x", padx=8)
    trust_source = tk.Label(trust_frame, text="", fg="#8d93a5", bg="#0b0c10", font=("Menlo", 7), anchor="w")
    trust_source.pack(fill="x", padx=8)
    trust_counts = tk.Label(trust_frame, text="", fg="#8d93a5", bg="#0b0c10", font=("Menlo", 7), anchor="w")
    trust_counts.pack(fill="x", padx=8, pady=(0, 6))

    controls = tk.Frame(root, bg="#101116")
    controls.pack()
    menu = tk.Menu(root, tearoff=0, bg="#101116", fg="#f8f5ea", activebackground="#1f2937", activeforeground="#ffffff")

    drag = {"x": 0, "y": 0, "start_x": 0, "start_y": 0, "moved": False}

    def start_drag(event: tk.Event) -> None:
        drag["x"] = event.x_root - root.winfo_x()
        drag["y"] = event.y_root - root.winfo_y()
        drag["start_x"] = event.x_root
        drag["start_y"] = event.y_root
        drag["moved"] = False

    def do_drag(event: tk.Event) -> None:
        if abs(event.x_root - drag["start_x"]) > 4 or abs(event.y_root - drag["start_y"]) > 4:
            drag["moved"] = True
        root.geometry(f"+{event.x_root - drag['x']}+{event.y_root - drag['y']}")

    def save_position() -> None:
        VOICE_DIR.mkdir(parents=True, exist_ok=True)
        UI_STATE_PATH.write_text(json.dumps({"x": root.winfo_x(), "y": root.winfo_y()}, indent=2) + "\n")

    def dock_to_edge(_event: tk.Event | None = None) -> None:
        if not drag["moved"]:
            return
        current_x = root.winfo_x()
        current_y = root.winfo_y()
        edge_margin = 14
        distances = {
            "left": current_x,
            "right": screen_w - (current_x + width),
            "top": current_y,
            "bottom": screen_h - (current_y + height),
        }
        edge = min(distances, key=distances.get)
        dock_x = edge_margin if edge == "left" else screen_w - width - edge_margin if edge == "right" else current_x
        dock_y = 48 if edge == "top" else screen_h - height - edge_margin if edge == "bottom" else current_y
        dock_x = max(edge_margin, min(dock_x, screen_w - width - edge_margin))
        dock_y = max(48, min(dock_y, screen_h - height - edge_margin))
        root.geometry(f"+{dock_x}+{dock_y}")
        save_position()

    for widget in (root, canvas, title, subtitle):
        widget.bind("<ButtonPress-1>", start_drag)
        widget.bind("<B1-Motion>", do_drag)
        widget.bind("<ButtonRelease-1>", dock_to_edge)

    def action_on() -> None:
        set_on()
        play_activation_sound()
        root.after(450, speak_activation_greeting)
        notify("Voice Vibe is on.")

    def action_off() -> None:
        set_off()
        notify("Voice Vibe is dormant.")

    def action_silent() -> None:
        set_silent()
        notify("Voice Vibe is on but silent.")

    def action_live_on() -> None:
        set_live_on()
        play_activation_sound()
        notify("Supernova Live is connecting.")

    def action_live_off() -> None:
        set_live_off()
        notify("Supernova Live is dormant.")

    def action_vision_on() -> None:
        set_live_vision(True)
        notify("Supernova Live screen vision is enabled.")

    def action_vision_off() -> None:
        set_live_vision(False)
        notify("Supernova Live screen vision is disabled.")

    def action_focus() -> None:
        set_profile("focus")
        notify("Voice Vibe focus mode is on.")

    def action_review() -> None:
        set_profile("review")
        notify("Voice Vibe review mode is on.")

    def action_strict() -> None:
        set_policy("strict")
        notify("Voice Vibe policy is strict.")

    def action_toggle() -> None:
        if current_state().get("enabled"):
            action_off()
        else:
            action_on()

    def action_briefing() -> None:
        if not current_state().get("enabled"):
            notify("Voice Vibe is dormant. Turn it on before briefing.")
            return
        if BRIEFING_READER.exists():
            subprocess.Popen(
                [sys.executable, str(BRIEFING_READER), "--read-briefing"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            notify("Reading the latest briefing.")

    def action_open_ledger() -> None:
        ledger = Path(read_config().get("VOICE_LEDGER_PATH", str(LEDGER_PATH_DEFAULT))).expanduser()
        subprocess.Popen(["open", str(ledger)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def action_open_cockpit() -> None:
        subprocess.Popen(
            ["open", "https://the-one-system-ui.vercel.app/?view=control"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    def action_recover() -> None:
        commands = [
            ["launchctl", "kickstart", "-k", f"gui/{os.getuid()}/com.alexanderanthony.voice-vibe-bridge"],
            ["pm2", "restart", "supernova-intel-api"],
            ["pm2", "restart", "supernova-matrix"],
            ["pm2", "restart", "memory-engine"],
        ]
        for command in commands:
            subprocess.run(command, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        notify("Supernova recovery requested.")

    menu.add_command(label="Voice Vibe ON", command=action_on)
    menu.add_command(label="Voice Vibe OFF / Dormant", command=action_off)
    menu.add_command(label="Supernova Live ON", command=action_live_on)
    menu.add_command(label="Supernova Live OFF", command=action_live_off)
    menu.add_command(label="Live Vision ON", command=action_vision_on)
    menu.add_command(label="Live Vision OFF", command=action_vision_off)
    menu.add_command(label="Silent Profile", command=action_silent)
    menu.add_command(label="Focus Profile", command=action_focus)
    menu.add_command(label="Review Profile", command=action_review)
    menu.add_separator()
    menu.add_command(label="Read Latest Briefing", command=action_briefing)
    menu.add_command(label="Strict Reporting Policy", command=action_strict)
    menu.add_command(label="Open Ledger", command=action_open_ledger)
    menu.add_command(label="Open Supernova Cockpit", command=action_open_cockpit)
    menu.add_command(label="Recover Supernova Services", command=action_recover)
    menu.add_separator()
    menu.add_command(label="Hide Companion", command=root.withdraw)
    menu.add_command(label="Quit Companion", command=root.destroy)

    def show_menu(event: tk.Event) -> None:
        menu.tk_popup(event.x_root, event.y_root)

    root.bind("<Button-2>", show_menu)
    root.bind("<Button-3>", show_menu)
    canvas.bind("<Double-Button-1>", lambda _event: action_briefing())

    click_timer = {"id": None, "double_at": 0.0}

    def pixel_click(_event: tk.Event) -> None:
        if drag["moved"] or time.monotonic() - click_timer["double_at"] < 0.45:
            return
        if click_timer["id"] is not None:
            root.after_cancel(click_timer["id"])
        click_timer["id"] = root.after(260, action_toggle)

    def pixel_double_click(_event: tk.Event) -> None:
        click_timer["double_at"] = time.monotonic()
        if click_timer["id"] is not None:
            root.after_cancel(click_timer["id"])
            click_timer["id"] = None
        action_briefing()

    canvas.bind("<ButtonRelease-1>", pixel_click, add="+")
    canvas.bind("<Double-Button-1>", pixel_double_click)

    button_opts = {
        "font": ("Menlo", 9, "bold"),
        "relief": "flat",
        "bd": 0,
        "padx": 8,
        "pady": 5,
        "activeforeground": "#ffffff",
    }
    tk.Button(controls, text="ON", command=action_on, fg="#07110c", bg="#65f4a6", activebackground="#40d981", **button_opts).pack(side="left", padx=3)
    tk.Button(controls, text="LIVE", command=action_live_on, fg="#07111a", bg="#4cc9f0", activebackground="#22a9d6", **button_opts).pack(side="left", padx=3)
    tk.Button(controls, text="OFF", command=action_off, fg="#101116", bg="#b7bdc9", activebackground="#939aa8", **button_opts).pack(side="left", padx=3)
    tk.Button(controls, text="SILENT", command=action_silent, fg="#101116", bg="#f0c66a", activebackground="#dba94b", **button_opts).pack(side="left", padx=3)

    utility_controls = tk.Frame(root, bg="#101116")
    utility_controls.pack(pady=(6, 0))
    tk.Button(utility_controls, text="COCKPIT", command=action_open_cockpit, fg="#07111a", bg="#4cc9f0", activebackground="#22a9d6", **button_opts).pack(side="left", padx=3)
    tk.Button(utility_controls, text="RECOVER", command=action_recover, fg="#ffffff", bg="#7c3aed", activebackground="#6d28d9", **button_opts).pack(side="left", padx=3)

    pulse = {"i": 0}

    def draw_pixel(mode: str) -> None:
        canvas.delete("all")
        palette = {
            "speaking": ("#fff1a8" if pulse["i"] % 2 else "#f0c66a", "#101116", "#4cc9f0", "SPEAKING"),
            "thinking": ("#c084fc" if pulse["i"] % 2 else "#4cc9f0", "#101116", "#312e81", "THINKING"),
            "listening": ("#4cc9f0", "#101116", "#164e63", "LISTENING"),
            "on": ("#65f4a6", "#101116", "#1d6f50", "ON WATCH"),
            "watching": ("#4cc9f0", "#101116", "#164e63", "WATCHING"),
            "focus": ("#c084fc", "#101116", "#4c1d95", "FOCUS"),
            "silent": ("#f0c66a", "#101116", "#713f12", "SILENT"),
            "warning": ("#ff6b6b", "#101116", "#7f1d1d", "WARNING"),
            "celebration": ("#65f4a6" if pulse["i"] % 2 else "#f0c66a", "#101116", "#064e3b", "VERIFIED"),
            "connecting": ("#4cc9f0", "#101116", "#164e63", "CONNECTING"),
            "interrupted": ("#ff6b6b", "#101116", "#7f1d1d", "INTERRUPTED"),
            "error": ("#ff6b6b", "#101116", "#7f1d1d", "LIVE ERROR"),
            "local": ("#f0c66a", "#101116", "#713f12", "LOCAL MODE"),
            "off": ("#5f6573", "#1a1c23", "#2a2d38", "DORMANT"),
        }
        body, eye, aura, label = palette.get(mode, palette["off"])

        bob = 2 if mode in {"thinking", "celebration"} and pulse["i"] % 2 else 0
        x, y, s = 96, 10 + bob, 8
        aura_pad = 15 if mode in {"speaking", "warning"} and pulse["i"] % 2 else 11
        canvas.create_rectangle(x - aura_pad, y + 5, x + 72 + aura_pad, y + 70, fill=aura, outline="")
        pixels = [
            (2, 0), (3, 0), (4, 0), (5, 0),
            (1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1),
            (1, 2), (2, 2), (3, 2), (4, 2), (5, 2), (6, 2),
            (0, 3), (1, 3), (2, 3), (3, 3), (4, 3), (5, 3), (6, 3), (7, 3),
            (0, 4), (1, 4), (2, 4), (3, 4), (4, 4), (5, 4), (6, 4), (7, 4),
            (1, 5), (2, 5), (3, 5), (4, 5), (5, 5), (6, 5),
            (2, 6), (3, 6), (4, 6), (5, 6),
        ]
        for px, py in pixels:
            canvas.create_rectangle(x + px * s, y + py * s, x + (px + 1) * s, y + (py + 1) * s, fill=body, outline="#101116")
        for px, py in [(2, 2), (5, 2)]:
            canvas.create_rectangle(x + px * s, y + py * s, x + (px + 1) * s, y + (py + 1) * s, fill=eye, outline="")
        mouth_y = y + 5 * s
        if mode in {"off", "focus", "silent"}:
            canvas.create_rectangle(x + 3 * s, mouth_y, x + 5 * s, mouth_y + 3, fill=eye, outline="")
        elif mode == "speaking":
            mouth_height = s * (2 if pulse["i"] % 2 else 1)
            canvas.create_rectangle(x + 3 * s, mouth_y, x + 5 * s, mouth_y + mouth_height, fill=eye, outline="")
        else:
            canvas.create_rectangle(x + 3 * s, mouth_y, x + 5 * s, mouth_y + s, fill=eye, outline="")
            canvas.create_rectangle(x + 4 * s, mouth_y + s, x + 5 * s, mouth_y + 2 * s, fill=eye, outline="")
        if mode == "listening":
            canvas.create_arc(x - 26, y + 13, x - 2, y + 49, start=270, extent=180, outline=body, width=3)
            canvas.create_arc(x + 66, y + 13, x + 90, y + 49, start=90, extent=180, outline=body, width=3)
        canvas.create_text(width // 2, 101, text=label, fill=body, font=("Menlo", 11, "bold"))

    def tick() -> None:
        pulse["i"] += 1
        if consume_show_request():
            root.state("normal")
            root.deiconify()
            root.update_idletasks()
            root.attributes("-topmost", False)
            root.lift()
            root.focus_force()
            root.attributes("-topmost", True)
        state = update_state()
        mode = str(state.get("visual_state", state.get("mode", "off")))
        draw_pixel(mode)
        subtitle.configure(text=f"{mode.upper()} · {state.get('profile', 'build')}")
        summary = watchdog_summary(read_watchdog_state())
        system_status.configure(
            text=summary,
            fg="#ff6b6b" if summary.endswith("ERROR") else "#4cc9f0",
        )
        queue_size = int(state.get("queue_size", 0))
        digest_size = int(state.get("digest_size", 0))
        policy_flag = (
            "QUIET"
            if state.get("quiet_hours_active")
            else str(state.get("last_rejection_reason", "")).upper()
        )
        intelligence_status.configure(
            text=f"QUEUE {queue_size} | DIGEST {digest_size}"
            + (f" | {policy_flag}" if policy_flag else "")
            + f" | VOICE {str(state.get('vibevoice_status', 'offline')).upper()}",
            fg="#f0c66a" if state.get("quiet_hours_active") else "#8d93a5",
        )
        live_mode = str(state.get("live_status", "dormant")).upper()
        live_detail = str(
            state.get("live_error")
            or state.get("live_response_transcript")
            or state.get("live_transcript")
            or ""
        )
        live_status_label.configure(
            text=f"LIVE {live_mode}"
            + f" | {str(state.get('live_sovereign_mode', 'cloud')).upper()}"
            + (
                " | CAPTURING"
                if state.get("live_vision_capture_active")
                else ""
            )
            + (
                " | MISSION"
                if state.get("live_mission_store_enabled")
                else ""
            )
            + (
                f" | {int(state.get('live_latency_ms', 0) or 0)}MS"
                if int(state.get("live_latency_ms", 0) or 0) > 0
                else ""
            )
            + (f" | {live_detail[:18]}" if live_detail else ""),
            fg=(
                "#ff6b6b"
                if live_mode == "ERROR"
                else "#65f4a6"
                if live_mode in {"LISTENING", "SPEAKING"}
                else "#4cc9f0"
                if live_mode in {"CONNECTING", "THINKING"}
                else "#f0c66a"
                if live_mode == "LOCAL"
                else "#5f6573"
            ),
        )
        spoken = str(
            state.get("live_response_transcript")
            or state.get("live_transcript")
            or state.get("last_spoken")
            or state.get("last_source_text")
            or ""
        )
        if not state.get("enabled"):
            bubble_text = "Dormant. No narration will play."
        elif spoken:
            bubble_text = f"{spoken[:145]}{'...' if len(spoken) > 145 else ''}\n{source_age_label(state.get('last_source_at'))}"
        else:
            bubble_text = "Watching quietly. Double-click me for the latest briefing."
        bubble.configure(text=bubble_text)
        decision, source_age, counts = trust_summary(state)
        trust_decision.configure(
            text=decision,
            fg="#ff6b6b" if decision.startswith("BLOCKED") else "#65f4a6",
        )
        trust_source.configure(text=f"SOURCE {source_age}  |  LIMIT {state.get('max_source_age_hours', 24)}H")
        trust_counts.configure(text=counts)
        root.after(450 if mode in {"speaking", "thinking", "listening"} else 900, tick)

    root.protocol("WM_DELETE_WINDOW", root.iconify)
    root.bind("<Escape>", lambda _event: root.iconify())
    tick()
    root.mainloop()


def launch_show() -> None:
    request_show()
    subprocess.run(
        ["open", "-a", "Voice Vibe"],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("Voice Vibe companion requested.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Voice Vibe control surface")
    parser.add_argument(
        "command",
        nargs="?",
        default="status",
        choices=[
            "on", "off", "silent", "focus", "review", "status", "gui", "show",
            "live-on", "live-off",
            "vision-on", "vision-off",
            "policy-strict", "policy-open", "allow-user-text", "mute-user-text",
        ],
    )
    args = parser.parse_args()
    if args.command == "on":
        set_on()
    elif args.command == "off":
        set_off()
    elif args.command == "silent":
        set_silent()
    elif args.command == "live-on":
        set_live_on()
    elif args.command == "live-off":
        set_live_off()
    elif args.command == "vision-on":
        set_live_vision(True)
    elif args.command == "vision-off":
        set_live_vision(False)
    elif args.command in {"focus", "review"}:
        set_profile(args.command)
    elif args.command == "policy-strict":
        set_policy("strict")
    elif args.command == "policy-open":
        set_policy("open")
    elif args.command == "allow-user-text":
        set_user_text(True)
    elif args.command == "mute-user-text":
        set_user_text(False)
    elif args.command == "gui":
        run_gui()
    elif args.command == "show":
        launch_show()
    else:
        print_status()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
