#!/usr/bin/env python3
"""Voice Vibe: tiny macOS screen companion for Claude voice hooks."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

HOME = Path.home()
VOICE_DIR = HOME / ".claude" / "voice"
CONF_PATH = VOICE_DIR / "voice.conf"
STATE_PATH = Path("/tmp/.claude_voice_state.json")
PUBLIC_STATE_PATH = HOME / "Landing Page Sites" / "supernova" / "supernova-command" / "the-one-system-ui" / "public" / "voice-vibe-state.json"
REPORTING_MARKER = Path("/tmp/.claude_voice_reporting")
SHOW_MARKER = Path("/tmp/.claude_voice_show")
MASTER_MUTE_MARKER = Path("/tmp/.supernova_voice_muted")
INTELLIGENCE_STATE_PATH = Path("/tmp/.supernova_voice_intelligence.json")
VOICE_BUFFER_PATH = HOME / ".agents" / "voice_buffer.txt"
MUTED_ARCHIVE_DIR = HOME / ".agents" / "muted_voice_reports"
WATCHDOG_STATE_PATH = Path("/tmp/.supernova_watchdog.json")
LOG_PATH_DEFAULT = Path("/tmp/.claude_voice_log.txt")
LEDGER_PATH_DEFAULT = HOME / "Documents" / "Alexander OS" / "03 Workflows" / "Voice Vibe Ledger.md"

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
    try:
        MASTER_MUTE_MARKER.unlink()
    except FileNotFoundError:
        pass
    write_config({"ENABLED": "true", "PROFILE": "build"})
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
    MASTER_MUTE_MARKER.write_text(str(int(time.time())))
    stop_current_narration()
    archive_pending_reports()
    write_config({"ENABLED": "false", "PROFILE": "silent"})
    print("Voice Vibe: OFF / dormant")


def set_silent() -> None:
    MASTER_MUTE_MARKER.write_text(str(int(time.time())))
    stop_current_narration()
    write_config({"ENABLED": "true", "PROFILE": "silent"})
    print("Voice Vibe: ON / silent profile")


def set_profile(profile: str) -> None:
    if profile == "focus":
        MASTER_MUTE_MARKER.write_text(str(int(time.time())))
        stop_current_narration()
    else:
        try:
            MASTER_MUTE_MARKER.unlink()
        except FileNotFoundError:
            pass
    write_config({"ENABLED": "true", "PROFILE": profile})
    print(f"Voice Vibe: ON / {profile} profile")


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


def run_gui() -> None:
    import tkinter as tk

    root = tk.Tk()
    root.title("Voice Vibe")
    root.configure(bg="#101116")
    root.resizable(False, False)
    root.attributes("-topmost", True)

    width, height = 248, 292
    screen_w = root.winfo_screenwidth()
    root.geometry(f"{width}x{height}+{max(20, screen_w - width - 28)}+76")

    canvas = tk.Canvas(root, width=width, height=92, bg="#101116", highlightthickness=0)
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

    controls = tk.Frame(root, bg="#101116")
    controls.pack()
    menu = tk.Menu(root, tearoff=0, bg="#101116", fg="#f8f5ea", activebackground="#1f2937", activeforeground="#ffffff")

    drag = {"x": 0, "y": 0}

    def start_drag(event: tk.Event) -> None:
        drag["x"] = event.x_root - root.winfo_x()
        drag["y"] = event.y_root - root.winfo_y()

    def do_drag(event: tk.Event) -> None:
        root.geometry(f"+{event.x_root - drag['x']}+{event.y_root - drag['y']}")

    for widget in (root, canvas, title, subtitle):
        widget.bind("<ButtonPress-1>", start_drag)
        widget.bind("<B1-Motion>", do_drag)

    def action_on() -> None:
        set_on()
        notify("Voice Vibe is on.")

    def action_off() -> None:
        set_off()
        notify("Voice Vibe is dormant.")

    def action_silent() -> None:
        set_silent()
        notify("Voice Vibe is on but silent.")

    def action_focus() -> None:
        set_profile("focus")
        notify("Voice Vibe focus mode is on.")

    def action_review() -> None:
        set_profile("review")
        notify("Voice Vibe review mode is on.")

    def action_strict() -> None:
        set_policy("strict")
        notify("Voice Vibe policy is strict.")

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
    menu.add_command(label="Silent Profile", command=action_silent)
    menu.add_command(label="Focus Profile", command=action_focus)
    menu.add_command(label="Review Profile", command=action_review)
    menu.add_separator()
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

    button_opts = {
        "font": ("Menlo", 9, "bold"),
        "relief": "flat",
        "bd": 0,
        "padx": 10,
        "pady": 5,
        "activeforeground": "#ffffff",
    }
    tk.Button(controls, text="ON", command=action_on, fg="#07110c", bg="#65f4a6", activebackground="#40d981", **button_opts).pack(side="left", padx=3)
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
            "reporting": ("#fff1a8" if pulse["i"] % 2 else "#f0c66a", "#101116", "#4cc9f0", "REPORTING"),
            "on": ("#65f4a6", "#101116", "#1d6f50", "ON WATCH"),
            "watching": ("#4cc9f0", "#101116", "#164e63", "WATCHING"),
            "focus": ("#c084fc", "#101116", "#4c1d95", "FOCUS"),
            "silent": ("#f0c66a", "#101116", "#713f12", "SILENT"),
            "warning": ("#ff6b6b", "#101116", "#7f1d1d", "WARNING"),
            "celebration": ("#65f4a6" if pulse["i"] % 2 else "#f0c66a", "#101116", "#064e3b", "VERIFIED"),
            "off": ("#5f6573", "#1a1c23", "#2a2d38", "DORMANT"),
        }
        body, eye, aura, label = palette.get(mode, palette["off"])

        x, y, s = 78, 14, 8
        canvas.create_rectangle(x - 12, y + 8, x + 84, y + 76, fill=aura, outline="")
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
        if mode == "off":
            canvas.create_rectangle(x + 3 * s, mouth_y, x + 5 * s, mouth_y + 3, fill=eye, outline="")
        else:
            canvas.create_rectangle(x + 3 * s, mouth_y, x + 5 * s, mouth_y + s, fill=eye, outline="")
            canvas.create_rectangle(x + 4 * s, mouth_y + s, x + 5 * s, mouth_y + 2 * s, fill=eye, outline="")
        canvas.create_text(width // 2, 84, text=label, fill=body, font=("Menlo", 11, "bold"))

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
        mode = str(state.get("mode", "off"))
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
            + (f" | {policy_flag}" if policy_flag else ""),
            fg="#f0c66a" if state.get("quiet_hours_active") else "#8d93a5",
        )
        root.after(900 if mode == "reporting" else 1500, tick)

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
