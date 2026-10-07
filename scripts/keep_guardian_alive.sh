#!/bin/bash

# =========================================================
# Guardian Keep-Alive Script
# Ensures the GEMINI Collision Guardian agent is 24/7 active.
# =========================================================

GUARDIAN_SCRIPT="supernova/core/guardian.py"
VOICE_SCRIPT="scripts/voice_daemon.sh"
LOG_FILE="supernova/logs/guardian_keep_alive.log"

mkdir -p supernova/logs

echo "[$(date)] Keep-Alive monitoring started for Guardian and Voice agents." >> "$LOG_FILE"

while true; do
    # Monitor Guardian
    if ! pgrep -f "$GUARDIAN_SCRIPT" > /dev/null; then
        echo "[$(date)] Guardian not found. Restarting..." >> "$LOG_FILE"
        python3 "$GUARDIAN_SCRIPT" >> supernova/logs/guardian_stdout.log 2>&1 &
    fi

    # Monitor Voice Daemon
    if ! pgrep -f "$VOICE_SCRIPT" > /dev/null; then
        echo "[$(date)] Voice Daemon not found. Restarting..." >> "$LOG_FILE"
        bash "$VOICE_SCRIPT" >> supernova/logs/voice_stdout.log 2>&1 &
    fi
    
    sleep 60
done
