from __future__ import annotations

import importlib.util
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path.home() / ".claude" / "voice" / "voice_vibe.py"
SPEC = importlib.util.spec_from_file_location("voice_vibe_ui", MODULE_PATH)
assert SPEC and SPEC.loader
voice_vibe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(voice_vibe)


def test_visual_state_prioritizes_off():
    assert voice_vibe.visual_state({"enabled": False, "reporting": True}) == "off"


def test_visual_state_maps_worker_activity():
    assert voice_vibe.visual_state({"enabled": True, "vibevoice_status": "busy"}) == "thinking"
    assert voice_vibe.visual_state({"enabled": True, "reporting": True}) == "speaking"
    assert voice_vibe.visual_state({"enabled": True, "queue_size": 1}) == "listening"


def test_source_age_label_is_human_readable():
    recent = datetime.now().astimezone() - timedelta(minutes=5)
    assert voice_vibe.source_age_label(recent.isoformat()) == "5M AGO"
    assert voice_vibe.source_age_label("") == "NO SOURCE TIME"


def test_trust_summary_explains_blocked_reason():
    decision, source, counts = voice_vibe.trust_summary(
        {
            "enabled": True,
            "last_rejection_reason": "older_than_24_hours",
            "expired_count": 2,
            "duplicate_count": 1,
            "filtered_count": 3,
        }
    )
    assert decision == "BLOCKED: OLDER THAN 24 HOURS"
    assert source == "NO SOURCE TIME"
    assert counts == "STALE 2  DUP 1  FILTERED 3"


def test_activation_sound_uses_afplay(tmp_path):
    sound = tmp_path / "activation.aiff"
    sound.write_bytes(b"test")

    with patch.object(voice_vibe.subprocess, "Popen") as popen:
        assert voice_vibe.play_activation_sound(sound) is True

    assert popen.call_args.args[0] == ["/usr/bin/afplay", str(sound)]


def test_activation_sound_fails_safely_when_missing(tmp_path):
    with patch.object(voice_vibe.subprocess, "Popen") as popen:
        assert voice_vibe.play_activation_sound(tmp_path / "missing.aiff") is False
    popen.assert_not_called()


def test_activation_greeting_uses_bounded_say_command():
    with (
        patch.object(voice_vibe, "read_config", return_value={}),
        patch.object(voice_vibe.subprocess, "Popen") as popen,
    ):
        assert voice_vibe.speak_activation_greeting() is True

    assert popen.call_args.args[0] == [
        "/usr/bin/say",
        "-v",
        "Samantha",
        "-r",
        "158",
        (
            "Welcome back, Commander. Supernova is online. "
            "Core systems are standing by, and I'm ready for your command."
        ),
    ]


def test_activation_greeting_rejects_empty_text():
    with patch.object(voice_vibe.subprocess, "Popen") as popen:
        assert voice_vibe.speak_activation_greeting(" ") is False
    popen.assert_not_called()


def test_activation_greeting_uses_configured_voice_and_bounds_rate():
    with (
        patch.object(
            voice_vibe,
            "read_config",
            return_value={
                "ACTIVATION_GREETING": "Systems ready.",
                "ACTIVATION_VOICE": "Moira",
                "ACTIVATION_RATE": "999",
            },
        ),
        patch.object(voice_vibe.subprocess, "Popen") as popen,
    ):
        assert voice_vibe.speak_activation_greeting() is True

    assert popen.call_args.args[0] == [
        "/usr/bin/say",
        "-v",
        "Moira",
        "-r",
        "210",
        "Systems ready.",
    ]
