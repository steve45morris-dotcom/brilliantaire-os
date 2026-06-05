import json
from unittest.mock import patch
from datetime import datetime, time, timedelta, timezone

from voice_intelligence import (
    VoiceIntelligenceEngine,
    configured_engine,
    is_quiet_hour,
    normalize_report,
    parse_report,
)


NOW = datetime(2026, 6, 5, 22, 0, 0, tzinfo=timezone.utc)


def make_engine(tmp_path, **overrides):
    return VoiceIntelligenceEngine(
        state_path=tmp_path / "state.json",
        digest_path=tmp_path / "digest.json",
        archive_root=tmp_path / "archives",
        digest_size=overrides.get("digest_size", 3),
        digest_max_wait_seconds=overrides.get("digest_max_wait_seconds", 300),
        duplicate_window_hours=overrides.get("duplicate_window_hours", 24),
        quiet_start=overrides.get("quiet_start", time(22, 0)),
        quiet_end=overrides.get("quiet_end", time(8, 0)),
    )


def test_classifies_error_as_critical():
    report = parse_report(
        "2026-06-05 21:00:00 - ERROR database unavailable",
        now=NOW,
    )

    assert report.category == "error"
    assert report.critical is True


def test_classifies_supported_priority_categories():
    samples = {
        "blocker": "BLOCKER deployment credentials missing",
        "verify": "Verification passed for voice daemon",
        "deploy": "Deployment completed successfully",
        "complete": "Task Complete. Voice policy installed",
        "escalated": "Escalated action requires review",
    }

    for category, text in samples.items():
        report = parse_report(f"2026-06-05 21:00:00 - {text}", now=NOW)
        assert report.category == category


def test_rejects_routine_and_undated_reports():
    routine = parse_report("2026-06-05 21:00:00 - Signal clean", now=NOW)
    undated = parse_report("ERROR but timestamp is missing", now=NOW)

    assert routine.category is None
    assert undated.fresh is False


def test_normalization_ignores_timestamp_case_and_spacing():
    first = "2026-06-05 20:00:00 - Task Complete.   Voice READY"
    second = "2026-06-05 21:00:00 - task complete. voice ready"

    assert normalize_report(first) == normalize_report(second)


def test_quiet_hours_cross_midnight():
    start = time(22, 0)
    end = time(8, 0)

    assert is_quiet_hour(time(23, 0), start, end)
    assert is_quiet_hour(time(7, 59), start, end)
    assert not is_quiet_hour(time(12, 0), start, end)


def test_expired_and_routine_reports_are_archived(tmp_path):
    engine = make_engine(tmp_path)

    expired = engine.evaluate(
        "2026-06-04 21:59:59 - ERROR expired",
        now=NOW,
    )
    routine = engine.evaluate(
        "2026-06-05 21:00:00 - Signal clean",
        now=NOW,
    )

    assert expired.action == "expired"
    assert routine.action == "filtered"
    assert (tmp_path / "archives" / "expired.log").exists()
    assert (tmp_path / "archives" / "filtered.log").exists()


def test_duplicate_report_is_suppressed_for_24_hours(tmp_path):
    engine = make_engine(tmp_path, quiet_start=time(1, 0), quiet_end=time(2, 0))
    line = "2026-06-05 21:00:00 - ERROR database unavailable"

    first = engine.evaluate(line, now=NOW)
    engine.mark_spoken(first.speech, first.source_digests, now=NOW)
    duplicate = engine.evaluate(
        "2026-06-05 21:30:00 - error database unavailable",
        now=NOW + timedelta(minutes=30),
    )

    assert first.action == "speak"
    assert duplicate.action == "duplicate"


def test_duplicate_report_is_suppressed_while_waiting_in_digest(tmp_path):
    engine = make_engine(tmp_path, quiet_start=time(1, 0), quiet_end=time(2, 0))
    line = "2026-06-05 21:00:00 - Task Complete. Same build"

    first = engine.evaluate(line, now=NOW)
    duplicate = engine.evaluate(
        "2026-06-05 21:30:00 - task complete. same build",
        now=NOW + timedelta(minutes=30),
    )

    assert first.action == "staged"
    assert duplicate.action == "duplicate"


def test_duplicate_expires_after_24_hours(tmp_path):
    engine = make_engine(tmp_path, quiet_start=time(1, 0), quiet_end=time(2, 0))
    line = "2026-06-05 21:00:00 - ERROR database unavailable"
    first = engine.evaluate(line, now=NOW)
    engine.mark_spoken(first.speech, first.source_digests, now=NOW)

    later = engine.evaluate(
        "2026-06-06 22:00:01 - ERROR database unavailable",
        now=NOW + timedelta(hours=24, seconds=1),
    )

    assert later.action == "speak"


def test_three_noncritical_reports_create_one_digest(tmp_path):
    engine = make_engine(tmp_path, quiet_start=time(1, 0), quiet_end=time(2, 0))
    first = engine.evaluate(
        "2026-06-05 21:00:00 - Task Complete. Build one",
        now=NOW,
    )
    second = engine.evaluate(
        "2026-06-05 21:01:00 - Verification passed for build two",
        now=NOW + timedelta(minutes=1),
    )
    third = engine.evaluate(
        "2026-06-05 21:02:00 - Deployment completed for build three",
        now=NOW + timedelta(minutes=2),
    )

    assert first.action == "staged"
    assert second.action == "staged"
    assert third.action == "speak"
    assert third.digest_count == 3
    assert len(third.speech) <= 500


def test_digest_releases_after_maximum_wait(tmp_path):
    engine = make_engine(
        tmp_path,
        digest_size=3,
        digest_max_wait_seconds=300,
        quiet_start=time(1, 0),
        quiet_end=time(2, 0),
    )
    engine.evaluate(
        "2026-06-05 21:00:00 - Task Complete. Build one",
        now=NOW,
    )

    decision = engine.flush(now=NOW + timedelta(seconds=301))

    assert decision.action == "speak"
    assert decision.digest_count == 1


def test_quiet_hours_hold_digest_but_critical_bypasses(tmp_path):
    engine = make_engine(tmp_path)

    held = engine.evaluate(
        "2026-06-05 21:00:00 - Task Complete. Routine build",
        now=NOW,
    )
    critical = engine.evaluate(
        "2026-06-05 21:01:00 - ERROR production unavailable",
        now=NOW + timedelta(minutes=1),
    )

    assert held.action == "held"
    assert critical.action == "speak"


def test_corrupt_state_recovers_and_status_contains_dashboard_fields(tmp_path):
    state_path = tmp_path / "state.json"
    state_path.write_text("{not-json")
    engine = VoiceIntelligenceEngine(
        state_path=state_path,
        digest_path=tmp_path / "digest.json",
        archive_root=tmp_path / "archives",
    )

    status = engine.status(now=NOW)

    assert status["queue_size"] == 0
    assert status["digest_size"] == 0
    assert status["expired_count"] == 0
    assert status["filtered_count"] == 0
    assert status["duplicate_count"] == 0
    assert status["last_spoken"] == ""
    assert status["last_rejection_reason"] == ""
    assert status["quiet_hours_active"] is True
    json.loads(state_path.read_text())


def test_evaluate_persists_current_dashboard_telemetry(tmp_path):
    engine = make_engine(tmp_path)

    engine.evaluate(
        "2026-06-05 21:00:00 - Task Complete. Quiet build",
        now=NOW,
    )
    state = json.loads((tmp_path / "state.json").read_text())

    assert state["digest_size"] == 1
    assert state["quiet_hours_active"] is True
    assert state["next_digest_reason"] == "quiet_hours"


def test_invalid_numeric_config_uses_safe_defaults(tmp_path):
    config = tmp_path / "voice.conf"
    config.write_text(
        "VOICE_DIGEST_SIZE=broken\n"
        "VOICE_DIGEST_MAX_WAIT_SECONDS=-2\n"
        "VOICE_DUPLICATE_WINDOW_HOURS=none\n"
    )

    with patch.dict(
        "os.environ",
        {
            "VOICE_CONF": str(config),
            "VOICE_INTELLIGENCE_STATE": str(tmp_path / "state.json"),
            "VOICE_DIGEST_STATE": str(tmp_path / "digest.json"),
            "VOICE_INTELLIGENCE_ARCHIVES": str(tmp_path / "archives"),
            "VOICE_BUFFER": str(tmp_path / "buffer.txt"),
        },
        clear=False,
    ):
        engine = configured_engine()

    assert engine.digest_size == 3
    assert engine.digest_max_wait_seconds == 300
    assert engine.duplicate_window == timedelta(hours=24)
