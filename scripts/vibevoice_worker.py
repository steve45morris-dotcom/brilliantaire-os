#!/usr/bin/env python3
"""Persistent local VibeVoice worker with mute-safe playback and telemetry."""

from __future__ import annotations

import json
import os
import socketserver
import subprocess
import sys
import time
import wave
from datetime import datetime
from pathlib import Path
from typing import Callable

from voice_authority import allow_narration, is_enabled

SOCKET_PATH = Path(os.environ.get("VIBEVOICE_SOCKET", "/tmp/vibevoice-worker.sock"))
STATE_PATH = Path(os.environ.get("VIBEVOICE_STATE", "/tmp/.vibevoice_worker_state.json"))
MUTE_MARKER = Path(os.environ.get("VOICE_MUTE_MARKER", "/tmp/.supernova_voice_muted"))
VOICE_CONF = Path(os.environ.get("VOICE_CONF", str(Path.home() / ".claude" / "voice" / "voice.conf")))
OUTPUT_ROOT = Path(os.environ.get("VIBEVOICE_OUTPUT_ROOT", "/tmp/vibevoice-worker"))
MAX_CHARS = int(os.environ.get("VIBEVOICE_MAX_CHARS", "500"))


def utc_now() -> str:
    return datetime.now().astimezone().isoformat()


def voice_is_muted() -> bool:
    if not is_enabled():
        return True
    if MUTE_MARKER.exists():
        return True
    config = {"ENABLED": "true", "PROFILE": "build"}
    try:
        lines = VOICE_CONF.read_text(errors="ignore").splitlines()
    except OSError:
        lines = []
    for raw in lines:
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        config[key.strip()] = value.split("#", 1)[0].strip().strip("\"'")
    return (
        config.get("ENABLED", "true").lower() != "true"
        or config.get("PROFILE", "build").lower() in {"silent", "focus"}
    )


class RuntimeState:
    def __init__(self, path: Path = STATE_PATH):
        self.path = path
        self.value = {
            "status": "starting",
            "queue_depth": 0,
            "load_ms": None,
            "last_generation_ms": None,
            "last_error": "",
            "last_played_at": "",
            "updated_at": utc_now(),
        }
        self.save()

    def update(self, **changes: object) -> None:
        self.value.update(changes)
        self.value["updated_at"] = utc_now()
        self.save()

    def save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.path.with_suffix(self.path.suffix + ".tmp")
        temporary.write_text(json.dumps(self.value, indent=2, sort_keys=True) + "\n")
        temporary.replace(self.path)


class VibeVoiceEngine:
    def __init__(self):
        self.manager = None

    def warm(self) -> None:
        script_dir = Path(__file__).resolve().parent
        roots = [
            script_dir.parent / "Backend Services" / "services" / "VibeVoice",
            script_dir.parent / "Backend Services" / "orchestrators",
            Path.home() / "Backend Services" / "services" / "VibeVoice",
            Path.home() / "Backend Services" / "orchestrators",
        ]
        for root in roots:
            value = str(root)
            if root.exists() and value not in sys.path:
                sys.path.insert(0, value)
        from supernova.modules.vibevoice import manager

        manager.load_tts()
        self.manager = manager

    def generate(self, text: str, voice: str):
        if self.manager is None:
            raise RuntimeError("VibeVoice engine is not warm")
        return self.manager.speak(text, voice_preset=voice)


class SpeechRuntime:
    def __init__(
        self,
        *,
        engine,
        state: RuntimeState,
        muted: Callable[[], bool] = voice_is_muted,
        player: Callable[[Path], int] | None = None,
        output_root: Path = OUTPUT_ROOT,
        max_chars: int = MAX_CHARS,
    ):
        self.engine = engine
        self.state = state
        self.muted = muted
        self.player = player or self._play
        self.output_root = output_root
        self.max_chars = max_chars

    @staticmethod
    def _play(path: Path) -> int:
        process = subprocess.Popen(
            ["/usr/bin/afplay", str(path)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        while process.poll() is None:
            if not is_enabled():
                process.terminate()
                try:
                    process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    process.kill()
                return 2
            time.sleep(0.1)
        return int(process.returncode or 0)

    def warm(self) -> None:
        started = time.monotonic()
        self.state.update(status="warming", last_error="")
        try:
            self.engine.warm()
        except Exception as error:
            self.state.update(status="failed", last_error=f"{type(error).__name__}: {error}")
            raise
        self.state.update(
            status="ready",
            load_ms=round((time.monotonic() - started) * 1000),
            last_error="",
        )

    def handle(self, request: dict[str, object]) -> dict[str, object]:
        text = str(request.get("text", "")).strip()
        voice = str(request.get("voice", "en-Mike_man")).strip() or "en-Mike_man"
        play = bool(request.get("play", True))
        allowed, reason = allow_narration(
            text,
            source_timestamp=request.get("source_timestamp"),
            dedupe=bool(request.get("dedupe", True)),
        )
        try:
            deadline = float(request.get("deadline", 0.0))
        except (TypeError, ValueError):
            deadline = 0.0
        if not text or len(text) > self.max_chars:
            return {"ok": False, "status": "invalid"}
        if self.muted() or not allowed:
            self.state.update(status="ready", queue_depth=0)
            return {"ok": False, "status": reason if reason != "allowed" else "muted"}

        started = time.monotonic()
        self.state.update(status="busy", queue_depth=1, last_error="")
        try:
            audio = self.engine.generate(text, voice)
            generation_ms = round((time.monotonic() - started) * 1000)
            if getattr(audio, "size", 0) == 0:
                raise RuntimeError("VibeVoice returned empty audio")
            self.output_root.mkdir(parents=True, exist_ok=True)
            self.output_root.chmod(0o700)
            output_path = self.output_root / f"speech-{time.time_ns()}.wav"
            pcm = (audio.clip(-1.0, 1.0) * 32767).astype("<i2").tobytes()
            with wave.open(str(output_path), "wb") as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(24000)
                output.writeframes(pcm)
            output_path.chmod(0o600)
            if deadline and time.time() >= deadline:
                output_path.unlink(missing_ok=True)
                self.state.update(
                    status="ready",
                    queue_depth=0,
                    last_generation_ms=generation_ms,
                    last_error="request deadline expired",
                )
                return {"ok": False, "status": "timeout", "generation_ms": generation_ms}
            if self.muted():
                output_path.unlink(missing_ok=True)
                self.state.update(
                    status="ready",
                    queue_depth=0,
                    last_generation_ms=generation_ms,
                )
                return {"ok": False, "status": "muted", "generation_ms": generation_ms}
            if play and self.player(output_path) != 0:
                raise RuntimeError("audio playback failed")
            if play:
                output_path.unlink(missing_ok=True)
            played_at = utc_now() if play else ""
            self.state.update(
                status="ready",
                queue_depth=0,
                last_generation_ms=generation_ms,
                last_played_at=played_at,
                last_error="",
            )
            return {
                "ok": True,
                "status": "played" if play else "generated",
                "generation_ms": generation_ms,
                "output_path": str(output_path),
            }
        except Exception as error:
            message = f"{type(error).__name__}: {error}"
            self.state.update(status="ready", queue_depth=0, last_error=message)
            return {"ok": False, "status": "failed", "error": message}


class WorkerRequestHandler(socketserver.StreamRequestHandler):
    def handle(self) -> None:
        try:
            payload = self.rfile.readline(MAX_CHARS * 4)
            request = json.loads(payload)
            if not isinstance(request, dict):
                raise ValueError("request must be an object")
            response = self.server.runtime.handle(request)  # type: ignore[attr-defined]
        except (json.JSONDecodeError, UnicodeDecodeError, ValueError) as error:
            response = {"ok": False, "status": "invalid", "error": str(error)}
        try:
            self.wfile.write((json.dumps(response) + "\n").encode())
        except (BrokenPipeError, ConnectionResetError):
            pass


class WorkerServer(socketserver.UnixStreamServer):
    request_queue_size = 2

    def __init__(self, socket_path: Path, runtime: SpeechRuntime):
        self.runtime = runtime
        if socket_path.exists():
            socket_path.unlink()
        super().__init__(str(socket_path), WorkerRequestHandler)
        os.chmod(socket_path, 0o600)


def main() -> int:
    state = RuntimeState()
    runtime = SpeechRuntime(engine=VibeVoiceEngine(), state=state)
    runtime.warm()
    with WorkerServer(SOCKET_PATH, runtime) as server:
        state.update(status="ready")
        try:
            server.serve_forever(poll_interval=0.5)
        finally:
            state.update(status="stopped", queue_depth=0)
            SOCKET_PATH.unlink(missing_ok=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
