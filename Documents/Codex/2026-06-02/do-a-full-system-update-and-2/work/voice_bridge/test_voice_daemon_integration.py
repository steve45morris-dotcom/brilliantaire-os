import os
import subprocess
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).parent
DAEMON = ROOT / "voice_daemon.sh"
ENGINE = ROOT / "voice_intelligence.py"


def run_daemon(tmp_path: Path, line: str = "") -> list[str]:
    buffer_path = tmp_path / "voice_buffer.txt"
    if line:
        buffer_path.write_text(line + "\n")
    elif not buffer_path.exists():
        buffer_path.write_text("")
    config_path = tmp_path / "voice.conf"
    config_path.write_text(
        "\n".join(
            [
                "ENABLED=true",
                "PROFILE=build",
                "VOICE_QUIET_START=01:00",
                "VOICE_QUIET_END=02:00",
                "VOICE_DIGEST_SIZE=3",
                "VOICE_DIGEST_MAX_WAIT_SECONDS=300",
                "VOICE_DUPLICATE_WINDOW_HOURS=24",
            ]
        )
        + "\n"
    )
    speech_log = tmp_path / "speech.log"
    stub = tmp_path / "speak-stub.sh"
    stub.write_text(
        "#!/bin/bash\n"
        f"printf '%s\\n' \"$1\" >> {speech_log!s}\n"
    )
    stub.chmod(0o755)
    env = os.environ.copy()
    env.update(
        {
            "VOICE_BUFFER": str(buffer_path),
            "VOICE_CONF": str(config_path),
            "VOICE_MUTE_MARKER": str(tmp_path / "missing-mute"),
            "VOICE_DAEMON_LOCK": str(tmp_path / "daemon.lock"),
            "VOICE_DAEMON_LOG": str(tmp_path / "daemon.log"),
            "VOICE_INTELLIGENCE_ENGINE": str(ENGINE),
            "VOICE_INTELLIGENCE_STATE": str(tmp_path / "state.json"),
            "VOICE_DIGEST_STATE": str(tmp_path / "digest.json"),
            "VOICE_INTELLIGENCE_ARCHIVES": str(tmp_path / "archives"),
            "VOICE_SPEAK_COMMAND": str(stub),
            "VOICE_DAEMON_ONCE": "1",
        }
    )

    subprocess.run(
        ["/bin/bash", str(DAEMON)],
        check=True,
        env=env,
        timeout=10,
    )
    if not speech_log.exists():
        return []
    return speech_log.read_text().splitlines()


def fresh_line(text: str) -> str:
    return f"{datetime.now().astimezone():%Y-%m-%d %H:%M:%S} - {text}"


def test_daemon_does_not_speak_expired_or_routine_reports(tmp_path):
    assert run_daemon(tmp_path, "2020-01-01 00:00:00 - ERROR expired") == []
    assert run_daemon(tmp_path, fresh_line("Signal clean")) == []


def test_daemon_speaks_critical_report_once(tmp_path):
    calls = run_daemon(tmp_path, fresh_line("ERROR production unavailable"))

    assert calls == ["ERROR production unavailable"]


def test_daemon_suppresses_duplicate_critical_report(tmp_path):
    line = fresh_line("ERROR production unavailable")

    first = run_daemon(tmp_path, line)
    second = run_daemon(tmp_path, line)

    assert first == ["ERROR production unavailable"]
    assert second == ["ERROR production unavailable"]


def test_daemon_speaks_one_digest_after_three_reports(tmp_path):
    first = run_daemon(tmp_path, fresh_line("Task Complete. Build one"))
    second = run_daemon(tmp_path, fresh_line("Verification passed for build two"))
    third = run_daemon(tmp_path, fresh_line("Deployment completed for build three"))

    assert first == []
    assert second == []
    assert len(third) == 1
    assert third[0].startswith("Voice digest.")
