#!/usr/bin/env python3
"""Bounded VibeVoice worker client with an explicit fallback policy."""

from __future__ import annotations

import argparse
import json
import os
import socket
import subprocess
import time
from pathlib import Path

from voice_authority import allow_narration, is_enabled

SOCKET_PATH = Path(os.environ.get("VIBEVOICE_SOCKET", "/tmp/vibevoice-worker.sock"))
BREAKER_PATH = Path(os.environ.get("VIBEVOICE_BREAKER_STATE", "/tmp/.vibevoice_breaker.json"))


class CircuitBreaker:
    def __init__(
        self,
        path: Path = BREAKER_PATH,
        *,
        threshold: int = 3,
        cooldown_seconds: int = 120,
    ):
        self.path = path
        self.threshold = max(1, threshold)
        self.cooldown_seconds = max(1, cooldown_seconds)
        self._ensure()

    def _default(self) -> dict[str, object]:
        return {"failures": 0, "opened_at": 0.0, "last_error": ""}

    def _load(self) -> dict[str, object]:
        try:
            value = json.loads(self.path.read_text())
        except (OSError, json.JSONDecodeError):
            value = self._default()
        if not isinstance(value, dict):
            value = self._default()
        result = self._default()
        result.update(value)
        return result

    def _save(self, value: dict[str, object]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        temporary.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
        temporary.replace(self.path)

    def _ensure(self) -> None:
        self._save(self._load())

    def status(self) -> dict[str, object]:
        return self._load()

    def is_open(self) -> bool:
        value = self._load()
        opened_at = float(value.get("opened_at", 0.0))
        if opened_at and time.time() - opened_at < self.cooldown_seconds:
            return True
        if opened_at:
            self.reset()
        return False

    def failure(self, error: str) -> None:
        value = self._load()
        failures = int(value.get("failures", 0)) + 1
        value.update(
            {
                "failures": failures,
                "opened_at": time.time() if failures >= self.threshold else 0.0,
                "last_error": error,
            }
        )
        self._save(value)

    def reset(self) -> None:
        self._save(self._default())


def send_request(
    request: dict[str, object],
    *,
    socket_path: Path = SOCKET_PATH,
    timeout: float = 45.0,
) -> dict[str, object]:
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as connection:
        connection.settimeout(timeout)
        connection.connect(str(socket_path))
        connection.sendall((json.dumps(request) + "\n").encode())
        response = b""
        while not response.endswith(b"\n"):
            chunk = connection.recv(4096)
            if not chunk:
                break
            response += chunk
    value = json.loads(response)
    if not isinstance(value, dict):
        raise ValueError("worker returned a non-object response")
    return value


def speak(
    text: str,
    *,
    voice: str = "en-Mike_man",
    timeout: float = 45.0,
    fallback_mode: str = "none",
    breaker: CircuitBreaker | None = None,
    source_timestamp: object | None = None,
    dedupe: bool = True,
) -> dict[str, object]:
    allowed, reason = allow_narration(
        text,
        source_timestamp=source_timestamp,
        dedupe=dedupe,
    )
    if not allowed:
        return {"ok": False, "status": reason}
    active_breaker = breaker or CircuitBreaker()
    if active_breaker.is_open():
        return {"ok": False, "status": "cooldown"}
    try:
        result = send_request(
            {
                "text": text,
                "voice": voice,
                "play": True,
                "deadline": time.time() + timeout,
                "source_timestamp": source_timestamp,
                "dedupe": False,
            },
            timeout=timeout,
        )
    except (socket.timeout, TimeoutError) as error:
        active_breaker.failure(f"timeout: {error}")
        result = {"ok": False, "status": "timeout"}
    except (ConnectionError, OSError, ValueError, json.JSONDecodeError) as error:
        active_breaker.failure(f"unavailable: {error}")
        result = {"ok": False, "status": "unavailable"}
    else:
        if result.get("ok"):
            active_breaker.reset()
            return result
        if result.get("status") not in {"muted", "invalid"}:
            active_breaker.failure(str(result.get("error", result.get("status", "failed"))))
        return result

    if fallback_mode == "system" and is_enabled():
        subprocess.run(
            ["/usr/bin/say", text],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return {"ok": True, "status": "fallback"}
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Speak through the warm VibeVoice worker")
    parser.add_argument("text")
    parser.add_argument("--voice", default="en-Mike_man")
    parser.add_argument("--timeout", type=float, default=float(os.environ.get("VIBEVOICE_TIMEOUT", "45")))
    parser.add_argument(
        "--fallback",
        choices=("none", "system"),
        default=os.environ.get("VOICE_FALLBACK_MODE", "none"),
    )
    args = parser.parse_args()
    result = speak(
        args.text,
        voice=args.voice,
        timeout=args.timeout,
        fallback_mode=args.fallback,
    )
    print(json.dumps(result, sort_keys=True))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
