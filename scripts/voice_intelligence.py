#!/usr/bin/env python3
"""Policy engine for recent, important, bounded Voice Vibe narration."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
from dataclasses import asdict, dataclass
from datetime import datetime, time, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Sequence

TIMESTAMP_FORMAT = "%Y-%m-%d %H:%M:%S"
TIMESTAMP_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s*-\s*")
MAX_REPORT_AGE = timedelta(hours=24)
MAX_DIGEST_CHARACTERS = 500

CATEGORY_PATTERNS = (
    ("blocker", re.compile(r"\b(blocker|blocked)\b", re.IGNORECASE)),
    ("error", re.compile(r"\b(error|failure|failed|fatal)\b", re.IGNORECASE)),
    ("verify", re.compile(r"\b(verify|verified|verification)\b", re.IGNORECASE)),
    ("deploy", re.compile(r"\b(deploy|deployed|deployment)\b", re.IGNORECASE)),
    ("complete", re.compile(r"\b(task complete|completed|completion)\b", re.IGNORECASE)),
    ("escalated", re.compile(r"\b(escalated|escalation)\b", re.IGNORECASE)),
)
CRITICAL_CATEGORIES = {"blocker", "error", "escalated"}


@dataclass(frozen=True)
class ParsedReport:
    line: str
    text: str
    timestamp: Optional[datetime]
    fresh: bool
    category: Optional[str]
    critical: bool


@dataclass(frozen=True)
class Decision:
    action: str
    speech: str = ""
    reason: str = ""
    category: Optional[str] = None
    digest_count: int = 0
    source_digests: Sequence[str] = ()

    def to_dict(self) -> Dict[str, object]:
        value = asdict(self)
        value["source_digests"] = list(self.source_digests)
        return value


def normalize_report(line: str) -> str:
    text = TIMESTAMP_PREFIX.sub("", line.strip())
    return " ".join(text.casefold().split())


def report_digest(line: str) -> str:
    return hashlib.sha256(normalize_report(line).encode("utf-8")).hexdigest()


def parse_report(
    line: str,
    *,
    now: Optional[datetime] = None,
    max_age: timedelta = MAX_REPORT_AGE,
) -> ParsedReport:
    current_time = now or datetime.now().astimezone()
    try:
        report_time = datetime.strptime(line[:19], TIMESTAMP_FORMAT)
    except ValueError:
        return ParsedReport(line, normalize_report(line), None, False, None, False)

    if current_time.tzinfo is not None:
        report_time = report_time.replace(tzinfo=current_time.tzinfo)
    fresh = current_time - report_time <= max_age
    text = TIMESTAMP_PREFIX.sub("", line.strip())
    category = None
    for name, pattern in CATEGORY_PATTERNS:
        if pattern.search(text):
            category = name
            break
    return ParsedReport(
        line=line,
        text=text,
        timestamp=report_time,
        fresh=fresh,
        category=category,
        critical=category in CRITICAL_CATEGORIES,
    )


def is_quiet_hour(current: time, start: time, end: time) -> bool:
    if start == end:
        return False
    if start < end:
        return start <= current < end
    return current >= start or current < end


def parse_clock(value: str, fallback: time) -> time:
    try:
        return datetime.strptime(value, "%H:%M").time()
    except ValueError:
        return fallback


def safe_positive_int(value: str, fallback: int) -> int:
    try:
        parsed = int(value)
    except ValueError:
        return fallback
    return parsed if parsed > 0 else fallback


def load_json(path: Path, fallback: object) -> object:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return fallback


def save_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")
    temporary.replace(path)


class VoiceIntelligenceEngine:
    def __init__(
        self,
        *,
        state_path: Path = Path("/tmp/.supernova_voice_intelligence.json"),
        digest_path: Path = Path("/tmp/.supernova_voice_digest.json"),
        archive_root: Path = Path.home() / ".agents" / "voice_intelligence_archives",
        queue_path: Path = Path.home() / ".agents" / "voice_buffer.txt",
        digest_size: int = 3,
        digest_max_wait_seconds: int = 300,
        duplicate_window_hours: int = 24,
        quiet_start: time = time(22, 0),
        quiet_end: time = time(8, 0),
    ):
        self.state_path = state_path
        self.digest_path = digest_path
        self.archive_root = archive_root
        self.queue_path = queue_path
        self.digest_size = max(1, digest_size)
        self.digest_max_wait_seconds = max(1, digest_max_wait_seconds)
        self.duplicate_window = timedelta(hours=max(1, duplicate_window_hours))
        self.quiet_start = quiet_start
        self.quiet_end = quiet_end
        self._ensure_state()

    def _default_state(self) -> Dict[str, object]:
        return {
            "spoken_hashes": {},
            "expired_count": 0,
            "filtered_count": 0,
            "duplicate_count": 0,
            "last_spoken": "",
            "last_rejection_reason": "",
            "last_action": "",
            "updated_at": "",
        }

    def _ensure_state(self) -> Dict[str, object]:
        state = load_json(self.state_path, self._default_state())
        if not isinstance(state, dict):
            state = self._default_state()
        defaults = self._default_state()
        defaults.update(state)
        if not isinstance(defaults.get("spoken_hashes"), dict):
            defaults["spoken_hashes"] = {}
        save_json(self.state_path, defaults)
        return defaults

    def _load_digest_entries(self) -> List[Dict[str, str]]:
        entries = load_json(self.digest_path, [])
        if not isinstance(entries, list):
            return []
        return [entry for entry in entries if isinstance(entry, dict)]

    def _save_digest_entries(self, entries: List[Dict[str, str]]) -> None:
        save_json(self.digest_path, entries)

    def _save_state(self, state: Dict[str, object], now: datetime) -> None:
        entries = self._load_digest_entries()
        try:
            queue_size = len(self.queue_path.read_text(errors="ignore").splitlines())
        except OSError:
            queue_size = 0
        quiet = is_quiet_hour(
            now.timetz().replace(tzinfo=None),
            self.quiet_start,
            self.quiet_end,
        )
        state.update(
            {
                "queue_size": queue_size,
                "digest_size": len(entries),
                "quiet_hours_active": quiet,
                "next_digest_reason": (
                    "quiet_hours"
                    if quiet and entries
                    else "size_threshold"
                    if len(entries) >= self.digest_size
                    else "waiting"
                    if entries
                    else "empty"
                ),
            }
        )
        state["updated_at"] = now.isoformat()
        save_json(self.state_path, state)

    def _archive(self, reason: str, line: str, state: Dict[str, object], now: datetime) -> None:
        self.archive_root.mkdir(parents=True, exist_ok=True)
        with (self.archive_root / f"{reason}.log").open("a") as archive:
            archive.write(line.rstrip() + "\n")
        count_key = f"{reason}_count"
        if count_key in state:
            state[count_key] = int(state.get(count_key, 0)) + 1
        state["last_rejection_reason"] = reason
        state["last_action"] = reason
        self._save_state(state, now)

    def _prune_hashes(self, state: Dict[str, object], now: datetime) -> None:
        hashes = state.get("spoken_hashes", {})
        if not isinstance(hashes, dict):
            hashes = {}
        kept = {}
        for digest, raw_time in hashes.items():
            try:
                spoken_at = datetime.fromisoformat(str(raw_time))
            except ValueError:
                continue
            if now - spoken_at <= self.duplicate_window:
                kept[str(digest)] = str(raw_time)
        state["spoken_hashes"] = kept

    def _is_duplicate(self, digest: str, state: Dict[str, object], now: datetime) -> bool:
        self._prune_hashes(state, now)
        hashes = state.get("spoken_hashes", {})
        if isinstance(hashes, dict) and digest in hashes:
            return True
        return any(
            str(entry.get("digest", "")) == digest
            for entry in self._load_digest_entries()
        )

    def _stage(self, report: ParsedReport, digest: str, now: datetime) -> List[Dict[str, str]]:
        entries = self._load_digest_entries()
        entries.append(
            {
                "line": report.line,
                "text": report.text,
                "digest": digest,
                "created_at": now.isoformat(),
            }
        )
        self._save_digest_entries(entries)
        return entries

    def _digest_decision(self, entries: List[Dict[str, str]]) -> Decision:
        selected = entries[: self.digest_size]
        summaries = [str(entry.get("text", "")).strip() for entry in selected]
        speech = "Voice digest. " + "; ".join(summary for summary in summaries if summary)
        if len(speech) > MAX_DIGEST_CHARACTERS:
            speech = speech[: MAX_DIGEST_CHARACTERS - 3].rstrip() + "..."
        return Decision(
            action="speak",
            speech=speech,
            reason="digest_ready",
            category="digest",
            digest_count=len(selected),
            source_digests=tuple(str(entry.get("digest", "")) for entry in selected),
        )

    def evaluate(self, line: str, *, now: Optional[datetime] = None) -> Decision:
        current_time = now or datetime.now().astimezone()
        state = self._ensure_state()
        report = parse_report(line, now=current_time)
        if not report.fresh:
            self._archive("expired", line, state, current_time)
            return Decision("expired", reason="older_than_24_hours_or_invalid_timestamp")
        if report.category is None:
            self._archive("filtered", line, state, current_time)
            return Decision("filtered", reason="routine_or_unclassified")

        digest = report_digest(line)
        if self._is_duplicate(digest, state, current_time):
            self._archive("duplicate", line, state, current_time)
            return Decision("duplicate", reason="spoken_within_24_hours", category=report.category)

        quiet = is_quiet_hour(current_time.timetz().replace(tzinfo=None), self.quiet_start, self.quiet_end)
        if report.critical:
            state["last_action"] = "speak"
            self._save_state(state, current_time)
            return Decision(
                "speak",
                speech=report.text,
                reason="critical_bypass" if quiet else "critical",
                category=report.category,
                digest_count=1,
                source_digests=(digest,),
            )

        entries = self._stage(report, digest, current_time)
        state["last_action"] = "held" if quiet else "staged"
        self._save_state(state, current_time)
        if quiet:
            return Decision("held", reason="quiet_hours", category=report.category)
        if len(entries) >= self.digest_size:
            return self._digest_decision(entries)
        return Decision("staged", reason="waiting_for_digest", category=report.category)

    def flush(self, *, now: Optional[datetime] = None) -> Decision:
        current_time = now or datetime.now().astimezone()
        entries = self._load_digest_entries()
        if not entries:
            return Decision("idle", reason="digest_empty")
        quiet = is_quiet_hour(current_time.timetz().replace(tzinfo=None), self.quiet_start, self.quiet_end)
        if quiet:
            return Decision("held", reason="quiet_hours")
        try:
            oldest = datetime.fromisoformat(str(entries[0]["created_at"]))
        except (KeyError, ValueError):
            oldest = current_time - timedelta(seconds=self.digest_max_wait_seconds)
        if len(entries) >= self.digest_size:
            return self._digest_decision(entries)
        if (current_time - oldest).total_seconds() >= self.digest_max_wait_seconds:
            return self._digest_decision(entries)
        return Decision("staged", reason="waiting_for_digest")

    def mark_spoken(
        self,
        speech: str,
        source_digests: Sequence[str],
        *,
        now: Optional[datetime] = None,
    ) -> None:
        current_time = now or datetime.now().astimezone()
        state = self._ensure_state()
        self._prune_hashes(state, current_time)
        hashes = state["spoken_hashes"]
        assert isinstance(hashes, dict)
        for digest in source_digests:
            if digest:
                hashes[digest] = current_time.isoformat()
        selected = set(source_digests)
        entries = [
            entry
            for entry in self._load_digest_entries()
            if str(entry.get("digest", "")) not in selected
        ]
        self._save_digest_entries(entries)
        state["last_spoken"] = speech
        state["last_rejection_reason"] = ""
        state["last_action"] = "spoken"
        self._save_state(state, current_time)

    def status(self, *, now: Optional[datetime] = None) -> Dict[str, object]:
        current_time = now or datetime.now().astimezone()
        state = self._ensure_state()
        self._prune_hashes(state, current_time)
        self._save_state(state, current_time)
        return state


def read_config(path: Path) -> Dict[str, str]:
    config: Dict[str, str] = {}
    try:
        lines = path.read_text(errors="ignore").splitlines()
    except OSError:
        return config
    for raw in lines:
        if "=" not in raw or raw.lstrip().startswith("#"):
            continue
        key, value = raw.split("=", 1)
        config[key.strip()] = value.split("#", 1)[0].strip().strip("\"'")
    return config


def configured_engine() -> VoiceIntelligenceEngine:
    config_path = Path(os.environ.get("VOICE_CONF", str(Path.home() / ".claude" / "voice" / "voice.conf")))
    config = read_config(config_path)
    return VoiceIntelligenceEngine(
        state_path=Path(os.environ.get("VOICE_INTELLIGENCE_STATE", "/tmp/.supernova_voice_intelligence.json")),
        digest_path=Path(os.environ.get("VOICE_DIGEST_STATE", "/tmp/.supernova_voice_digest.json")),
        archive_root=Path(
            os.environ.get(
                "VOICE_INTELLIGENCE_ARCHIVES",
                str(Path.home() / ".agents" / "voice_intelligence_archives"),
            )
        ),
        queue_path=Path(os.environ.get("VOICE_BUFFER", str(Path.home() / ".agents" / "voice_buffer.txt"))),
        digest_size=safe_positive_int(config.get("VOICE_DIGEST_SIZE", "3"), 3),
        digest_max_wait_seconds=safe_positive_int(
            config.get("VOICE_DIGEST_MAX_WAIT_SECONDS", "300"),
            300,
        ),
        duplicate_window_hours=safe_positive_int(
            config.get("VOICE_DUPLICATE_WINDOW_HOURS", "24"),
            24,
        ),
        quiet_start=parse_clock(config.get("VOICE_QUIET_START", "22:00"), time(22, 0)),
        quiet_end=parse_clock(config.get("VOICE_QUIET_END", "08:00"), time(8, 0)),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Voice Vibe intelligence policy engine")
    subparsers = parser.add_subparsers(dest="command", required=True)
    evaluate_parser = subparsers.add_parser("evaluate")
    evaluate_parser.add_argument("line")
    subparsers.add_parser("flush")
    spoken_parser = subparsers.add_parser("spoken")
    spoken_parser.add_argument("speech")
    spoken_parser.add_argument("digests", nargs="*")
    subparsers.add_parser("status")
    args = parser.parse_args()

    engine = configured_engine()
    if args.command == "evaluate":
        result = engine.evaluate(args.line).to_dict()
    elif args.command == "flush":
        result = engine.flush().to_dict()
    elif args.command == "spoken":
        engine.mark_spoken(args.speech, args.digests)
        result = {"action": "recorded"}
    else:
        result = engine.status()
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
