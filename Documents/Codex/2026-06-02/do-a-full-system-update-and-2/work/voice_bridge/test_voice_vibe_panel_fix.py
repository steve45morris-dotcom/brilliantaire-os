from unittest.mock import patch

from voice_vibe import (
    archive_pending_reports,
    consume_show_request,
    read_intelligence_state,
    read_live_state,
    read_worker_state,
    request_show,
    set_live_off,
    set_live_on,
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
    with patch("voice_vibe.authority_set_mode") as authority_set_mode, patch(
        "voice_vibe.write_config"
    ) as write_config, patch(
        "voice_vibe.archive_pending_reports"
    ) as archive_reports, patch("voice_vibe.update_state"):
        set_off()

    authority_set_mode.assert_called_once_with("off")
    archive_reports.assert_called_once_with()
    write_config.assert_called_once_with({"LIVE_ENABLED": "false"})


def test_set_on_clears_master_mute():
    with patch("voice_vibe.authority_set_mode") as authority_set_mode, patch(
        "voice_vibe.update_state"
    ), patch("voice_vibe.archive_pending_reports") as archive_reports:
        set_on()

    archive_reports.assert_called_once_with()
    authority_set_mode.assert_called_once_with("on")


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


def test_read_worker_state_exposes_runtime_health(tmp_path):
    state_path = tmp_path / "worker.json"
    state_path.write_text(
        '{"status":"ready","queue_depth":0,"load_ms":228000,'
        '"last_generation_ms":23000,"last_error":"","last_played_at":"now"}'
    )

    state = read_worker_state(state_path)

    assert state["vibevoice_status"] == "ready"
    assert state["vibevoice_load_ms"] == 228000
    assert state["vibevoice_generation_ms"] == 23000


def test_read_worker_state_recovers_from_corrupt_json(tmp_path):
    state_path = tmp_path / "worker.json"
    state_path.write_text("{broken")

    state = read_worker_state(state_path)

    assert state["vibevoice_status"] == "offline"
    assert state["vibevoice_queue_depth"] == 0


def test_read_live_state_returns_safe_fields(tmp_path):
    state_path = tmp_path / "live.json"
    state_path.write_text(
        '{"status":"listening","transcript":"hello",'
        '"response_transcript":"ready","error":"",'
        '"latest_latency_ms":145,"vision_capture_active":true,'
        '"sovereign_mode":"cloud","cloud_circuit_open":false,'
        '"acoustic_threshold_rms":320,"acoustic_noise_floor_rms":90,'
        '"mission_store_enabled":true}'
    )

    state = read_live_state(state_path)

    assert state["live_status"] == "listening"
    assert state["live_transcript"] == "hello"
    assert state["live_response_transcript"] == "ready"
    assert state["live_latency_ms"] == 145
    assert state["live_vision_capture_active"] is True
    assert state["live_sovereign_mode"] == "cloud"
    assert state["live_cloud_circuit_open"] is False
    assert state["live_acoustic_threshold_rms"] == 320
    assert state["live_acoustic_noise_floor_rms"] == 90
    assert state["live_mission_store_enabled"] is True


def test_read_live_state_recovers_from_corrupt_json(tmp_path):
    state_path = tmp_path / "live.json"
    state_path.write_text("{broken")
    assert read_live_state(state_path)["live_status"] == "dormant"


def test_live_on_enables_live_authority():
    with patch("voice_vibe.authority_set_mode") as authority_set_mode, patch(
        "voice_vibe.write_config"
    ) as write_config, patch("voice_vibe.update_state"):
        set_live_on()

    authority_set_mode.assert_called_once_with("on")
    write_config.assert_called_once_with({"LIVE_ENABLED": "true"})


def test_live_off_disables_live_without_enabling_reporting():
    with patch("voice_vibe.write_config") as write_config, patch(
        "voice_vibe.stop_current_narration"
    ) as stop_current_narration, patch("voice_vibe.update_state"):
        set_live_off()

    stop_current_narration.assert_called_once_with()
    write_config.assert_called_once_with({"LIVE_ENABLED": "false"})
