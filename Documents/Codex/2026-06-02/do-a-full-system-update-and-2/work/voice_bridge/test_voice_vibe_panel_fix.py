from pathlib import Path
from unittest.mock import MagicMock, patch

from voice_vibe import (
    archive_pending_reports,
    consume_show_request,
    read_intelligence_state,
    request_show,
    set_off,
    set_on,
    watchdog_summary,
)


def test_show_request_round_trip(tmp_path):
    marker = tmp_path / "show"

    request_show(marker)

    assert marker.exists()
    assert consume_show_request(marker) is True
    assert marker.exists() is False
    assert consume_show_request(marker) is False


def test_watchdog_summary_reports_healthy_services():
    state = {
        "voice_vibe": {"status": "online"},
        "voice_bridge": {"status": "online"},
        "supernova_intel": {"status": "online"},
        "supernova_matrix": {"status": "online"},
        "memory_engine": {"status": "online"},
    }

    assert watchdog_summary(state) == "SYSTEMS 5/5"


def test_watchdog_summary_names_first_failed_service():
    state = {
        "voice_vibe": {"status": "online"},
        "voice_bridge": {"status": "error"},
        "supernova_intel": {"status": "online"},
    }

    assert watchdog_summary(state) == "BRIDGE ERROR"


def test_set_off_stops_current_narration():
    marker = MagicMock()
    with patch("voice_vibe.MASTER_MUTE_MARKER", marker), patch(
        "voice_vibe.write_config"
    ) as write_config, patch(
        "voice_vibe.stop_current_narration"
    ) as stop_current_narration, patch(
        "voice_vibe.archive_pending_reports"
    ) as archive_reports:
        set_off()

    marker.write_text.assert_called_once()
    stop_current_narration.assert_called_once_with()
    archive_reports.assert_called_once_with()
    write_config.assert_called_once_with({"ENABLED": "false", "PROFILE": "silent"})


def test_set_on_clears_master_mute():
    marker = MagicMock()
    with patch("voice_vibe.MASTER_MUTE_MARKER", marker), patch(
        "voice_vibe.write_config"
    ), patch("voice_vibe.archive_pending_reports") as archive_reports:
        set_on()

    archive_reports.assert_called_once_with()
    marker.unlink.assert_called_once_with()


def test_archive_pending_reports_preserves_and_clears_queue(tmp_path):
    buffer_path = tmp_path / "voice_buffer.txt"
    archive_dir = tmp_path / "archive"
    buffer_path.write_text("first report\nsecond report")

    archive_path = archive_pending_reports(buffer_path, archive_dir)

    assert archive_path is not None
    assert archive_path.read_text() == "first report\nsecond report\n"
    assert buffer_path.read_text() == ""


def test_read_intelligence_state_returns_dashboard_fields(tmp_path):
    state_path = tmp_path / "intelligence.json"
    state_path.write_text(
        """
        {
          "queue_size": 2,
          "digest_size": 1,
          "expired_count": 4,
          "filtered_count": 5,
          "duplicate_count": 6,
          "last_spoken": "Verification passed",
          "last_rejection_reason": "duplicate",
          "quiet_hours_active": true,
          "next_digest_reason": "quiet_hours"
        }
        """
    )

    state = read_intelligence_state(state_path)

    assert state["queue_size"] == 2
    assert state["digest_size"] == 1
    assert state["expired_count"] == 4
    assert state["filtered_count"] == 5
    assert state["duplicate_count"] == 6
    assert state["last_spoken"] == "Verification passed"
    assert state["last_rejection_reason"] == "duplicate"
    assert state["quiet_hours_active"] is True
    assert state["next_digest_reason"] == "quiet_hours"


def test_read_intelligence_state_recovers_from_corrupt_json(tmp_path):
    state_path = tmp_path / "intelligence.json"
    state_path.write_text("{broken")

    state = read_intelligence_state(state_path)

    assert state["queue_size"] == 0
    assert state["digest_size"] == 0
    assert state["quiet_hours_active"] is False
