#!/bin/bash
# Voice Vibe Hotword & Emergency Phrase Daemon Launcher
# Double-clickable macOS command script

echo "========================================================"
echo "🎙️ LAUNCHING VOICE VIBE ASR & HOTWORD DAEMON"
echo "========================================================"
cd /Users/alexanderanthony/voice_vibe_asr || exit 1

PLIST="$HOME/Library/LaunchAgents/com.alexanderanthony.voicevibe-hotword.plist"

if [ -f "$PLIST" ]; then
    echo "[INFO] Loading Voice Vibe LaunchAgent service..."
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load -w "$PLIST"
    echo "✅ Voice Vibe Background Service is LOADED and ACTIVE!"
    echo "   Plist: $PLIST"
    echo "   Out Log: /tmp/voicevibe-hotword.out.log"
    echo "   Err Log: /tmp/voicevibe-hotword.err.log"
    echo ""
    echo "Tailing live events (Press Ctrl+C to stop viewing logs; daemon stays running in background):"
    touch /tmp/voicevibe-hotword.out.log
    tail -f /tmp/voicevibe-hotword.out.log
else
    echo "[INFO] Launching Voice Vibe in foreground..."
    /Users/alexanderanthony/.local/bin/python3.11 hotword_daemon.py --run
fi
