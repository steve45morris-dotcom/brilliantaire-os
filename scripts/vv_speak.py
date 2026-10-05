import argparse
import os
import subprocess
import sys
from pathlib import Path

MUTE_MARKER = Path("/tmp/.supernova_voice_muted")
VOICE_CONF = Path.home() / ".claude" / "voice" / "voice.conf"


def voice_is_muted() -> bool:
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
        config[key.strip()] = value.split("#", 1)[0].strip()
    return (
        config.get("ENABLED", "true").lower() != "true"
        or config.get("PROFILE", "build").lower() in {"silent", "focus"}
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="VibeVoice TTS CLI")
    parser.add_argument("text")
    parser.add_argument("--voice", default="en-Mike_man")
    parser.add_argument("--output", default="/tmp/vv_output.wav")
    parser.add_argument("--play", action="store_true")
    args = parser.parse_args()

    if voice_is_muted():
        return 0

    sys.path.insert(
        0,
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../Backend Services/services/VibeVoice",
            )
        ),
    )
    sys.path.insert(
        0,
        os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../Backend Services/orchestrators",
            )
        ),
    )
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    from supernova.modules.vibevoice import manager

    audio_data = manager.speak(args.text, voice_preset=args.voice)
    if audio_data.size == 0 or voice_is_muted():
        return 1

    import soundfile as sf

    sf.write(args.output, audio_data, 24000)
    if args.play and not voice_is_muted():
        player = "/usr/bin/afplay" if sys.platform == "darwin" else "aplay"
        subprocess.run([player, args.output], check=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
