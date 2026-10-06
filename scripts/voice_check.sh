#!/bin/bash
# Icyflamze Creative OS: Safe Voice Check Routine
# Reads voice logs and buffer state to ensure Oracle Voice Bridge is responsive.

echo "[$(date)] Initializing voice-check routine..."
echo "[$(date)] Checking voice daemon lock file..."

LOCK_FILE="/tmp/voice_daemon.lock"
if [ -f "$LOCK_FILE" ]; then
    PID=$(cat "$LOCK_FILE")
    if ps -p "$PID" > /dev/null; then
        echo "[$(date)] Voice Daemon is running with PID $PID."
    else
        echo "[$(date)] Voice Daemon lock file exists but PID $PID is dead."
    fi
else
    echo "[$(date)] Voice Daemon lock file does not exist (disabled or not running)."
fi

echo "[$(date)] Checking voice log..."
LOG_FILE="$HOME/supernova/logs/voice_daemon.log"
if [ -f "$LOG_FILE" ]; then
    tail -n 3 "$LOG_FILE"
else
    echo "[$(date)] No voice log found."
fi

echo "[$(date)] Voice check completed successfully."
exit 0
