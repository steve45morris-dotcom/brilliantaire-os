from __future__ import annotations

from datetime import datetime, timedelta

import voice_authority


def configure_paths(monkeypatch, tmp_path):
    conf = tmp_path / "voice.conf"
    state = tmp_path / "state.json"
    mute = tmp_path / "muted"
    reporting = tmp_path / "reporting"
    monkeypatch.setattr(voice_authority, "CONF_PATH", conf)
    monkeypatch.setattr(voice_authority, "STATE_PATH", state)
    monkeypatch.setattr(voice_authority, "MUTE_MARKER", mute)
    monkeypatch.setattr(voice_authority, "REPORTING_MARKER", reporting)
    return conf, state, mute


def test_off_is_authoritative(monkeypatch, tmp_path):
    conf, _state, mute = configure_paths(monkeypatch, tmp_path)
    monkeypatch.setattr(voice_authority, "stop_playback", lambda: None)

    result = voice_authority.set_mode("off")

    assert result["enabled"] is False
    assert mute.exists()
    assert "ENABLED=false" in conf.read_text()
    assert voice_authority.allow_narration("stay quiet") == (False, "muted")


def test_on_clears_master_mute(monkeypatch, tmp_path):
    conf, _state, mute = configure_paths(monkeypatch, tmp_path)
    mute.write_text("1")

    result = voice_authority.set_mode("on")

    assert result["enabled"] is True
    assert not mute.exists()
    assert "PROFILE=build" in conf.read_text()


def test_rejects_sources_older_than_24_hours(monkeypatch, tmp_path):
    configure_paths(monkeypatch, tmp_path)
    voice_authority.set_mode("on")
    stale = datetime.now().astimezone() - timedelta(hours=25)

    assert voice_authority.allow_narration(
        "old report",
        source_timestamp=stale.isoformat(),
    ) == (False, "stale")


def test_deduplicates_reports_for_24_hours(monkeypatch, tmp_path):
    configure_paths(monkeypatch, tmp_path)
    voice_authority.set_mode("on")
    timestamp = datetime.now().astimezone().isoformat()

    assert voice_authority.allow_narration(
        "same report",
        source_timestamp=timestamp,
    ) == (True, "allowed")
    assert voice_authority.allow_narration(
        "same report",
        source_timestamp=timestamp,
    ) == (False, "duplicate")


def test_interactive_speech_can_disable_deduplication(monkeypatch, tmp_path):
    configure_paths(monkeypatch, tmp_path)
    voice_authority.set_mode("on")

    assert voice_authority.allow_narration("repeat", dedupe=False) == (True, "allowed")
    assert voice_authority.allow_narration("repeat", dedupe=False) == (True, "allowed")
