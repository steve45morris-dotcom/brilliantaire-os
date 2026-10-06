#!/usr/bin/env python3
"""Shared Voice Vibe authority for every local narration path."""

from __future__ import annotations

import hashlib
import json
import subprocess
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

CONF_PATH = Path.home() / ".claude" / "voice" / "voice.conf"
STATE_PATH = Path("/tmp/.supernova_voice_authority.json")
MUTE_MARKER = Path("/tmp/.supernova_voice_muted")
REPORTING_MARKER = Path("/tmp/.claude_voice_reporting")
MAX_SOURCE_AGE = timedelta(hours=24)


def _read_config(path: Path | None = None) -> dict[str, str]:
    path = path or CONF_PATH
    values = {"ENABLED": "true", "PROFILE": "build"}
    try:
        lines = path.read_text(errors="ignore").splitlines()
    except OSError:
        return values
    for raw in lines:
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        values[key.strip()] = value.split("#", 1)[0].strip().strip("\"'")
    return values


def _write_config(updates: dict[str, str], path: Path | None = None) -> None:
    path = path or CONF_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []
    seen: set[str] = set()
    if path.exists():
        for raw in path.read_text(errors="ignore").splitlines():
            if "=" in raw and not raw.lstrip().startswith("#"):
                key = raw.split("=", 1)[0].strip()
                if key in updates:
                    lines.append(f"{key}={updates[key]}")
                    seen.add(key)
                    continue
            lines.append(raw)
    for key, value in updates.items():
        if key not in seen:
            lines.append(f"{key}={value}")
    temporary = path.with_suffix(".tmp")
    temporary.write_text("\n".join(lines).rstrip() + "\n")
    temporary.replace(path)


def _load_state(path: Path | None = None) -> dict[str, Any]:
    path = path or STATE_PATH
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        value = {}
    return value if isinstance(value, dict) else {}


def _save_state(value: dict[str, Any], path: Path | None = None) -> None:
    path = path or STATE_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
    temporary.replace(path)


def status() -> dict[str, Any]:
    config = _read_config()
    profile = config.get("PROFILE", "build").lower()
    enabled = (
        config.get("ENABLED", "true").lower() == "true"
        and profile not in {"silent", "focus"}
        and not MUTE_MARKER.exists()
    )
    saved = _load_state()
    reporting = enabled and REPORTING_MARKER.exists()
    return {
        **saved,
        "enabled": enabled,
        "mode": "reporting" if reporting else "on" if enabled else "off",
        "profile": profile,
        "reporting": reporting,
        "max_source_age_hours": 24,
        "updated_at": datetime.now().astimezone().isoformat(),
    }


def is_enabled() -> bool:
    return bool(status()["enabled"])


def stop_playback() -> None:
    for process_name in ("say", "afplay"):
        subprocess.run(
            ["/usr/bin/killall", process_name],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    REPORTING_MARKER.unlink(missing_ok=True)


def set_mode(mode: str) -> dict[str, Any]:
    normalized = mode.lower()
    if normalized == "on":
        MUTE_MARKER.unlink(missing_ok=True)
        _write_config({"ENABLED": "true", "PROFILE": "build"})
    elif normalized in {"off", "silent", "focus"}:
        MUTE_MARKER.write_text(str(int(time.time())))
        stop_playback()
        _write_config(
            {
                "ENABLED": "false" if normalized == "off" else "true",
                "PROFILE": "silent" if normalized in {"off", "silent"} else "focus",
            }
        )
    else:
        raise ValueError("mode must be on, off, silent, or focus")
    value = status()
    value["requested_mode"] = normalized
    _save_state({**_load_state(), **value})
    return value


def source_is_fresh(source_timestamp: object | None) -> bool:
    if source_timestamp is None or source_timestamp == "":
        return True
    try:
        if isinstance(source_timestamp, (int, float)):
            source_time = datetime.fromtimestamp(float(source_timestamp)).astimezone()
        else:
            raw = str(source_timestamp).replace("Z", "+00:00")
            source_time = datetime.fromisoformat(raw)
            if source_time.tzinfo is None:
                source_time = source_time.astimezone()
        return datetime.now().astimezone() - source_time <= MAX_SOURCE_AGE
    except (TypeError, ValueError, OSError):
        return False


def allow_narration(
    text: str,
    *,
    source_timestamp: object | None = None,
    dedupe: bool = True,
) -> tuple[bool, str]:
    if not is_enabled():
        return False, "muted"
    if not source_is_fresh(source_timestamp):
        return False, "stale"
    if not dedupe:
        return True, "allowed"

    now = datetime.now().astimezone()
    digest = hashlib.sha256(" ".join(text.casefold().split()).encode()).hexdigest()
    state = _load_state()
    recent = state.get("recent", {})
    if not isinstance(recent, dict):
        recent = {}
    kept: dict[str, str] = {}
    for key, raw_time in recent.items():
        try:
            spoken_at = datetime.fromisoformat(str(raw_time))
        except ValueError:
            continue
        if now - spoken_at <= MAX_SOURCE_AGE:
            kept[str(key)] = str(raw_time)
    if digest in kept:
        state["recent"] = kept
        _save_state(state)
        return False, "duplicate"
    kept[digest] = now.isoformat()
    state.update({"recent": kept, "last_text": text[:220], "last_allowed_at": now.isoformat()})
    _save_state(state)
    return True, "allowed"
