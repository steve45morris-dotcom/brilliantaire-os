#!/bin/bash
# P.J.K Companion & Live Telemetry Launcher
# Double-clickable macOS command script

echo "========================================================"
echo "⚡ LAUNCHING P.J.K. (PROF JOHN KUSH) COMPANION SYSTEM"
echo "========================================================"
cd "$HOME/PJK" || exit 1

if ./scripts/pjk status >/dev/null 2>&1; then
    echo "[INFO] P.J.K daemon is already running on port 8003."
else
    echo "[INFO] Starting P.J.K companion backend on port 8003..."
    ./scripts/pjk start 2>/dev/null || true
    sleep 2
    if ! ./scripts/pjk status >/dev/null 2>&1; then
        echo "[INFO] Launching direct P.J.K service..."
        nohup ./scripts/pjk serve > data/logs/pjk.stdout.log 2> data/logs/pjk.stderr.log &
        sleep 2
    fi
fi

UI_URL="http://127.0.0.1:8003/experience.html"
echo "[INFO] Opening P.J.K Live Telemetry HUD: $UI_URL"
open "$UI_URL"

echo ""
echo "✅ P.J.K Companion is LIVE!"
echo "   HUD URL: $UI_URL"
echo "   Status:  ./scripts/pjk status"
echo "   Stop:    ./scripts/pjk stop"
echo "========================================================"
