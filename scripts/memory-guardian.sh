#!/bin/bash
# Runs every 60s via launchd. Prevents system crashes from memory starvation.
# CHROME IS NEVER TOUCHED. Targets: Docker VM, idle PM2 services, Ollama.

FREE_PAGES=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
FREE_MB=$((FREE_PAGES * 4096 / 1048576))
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG="$HOME/scripts/memory-guardian.log"
MUTE_MARKER="/tmp/.supernova_voice_muted"
VOICE_CONF="$HOME/.claude/voice/voice.conf"

voice_is_muted() {
    [[ -f "$MUTE_MARKER" ]] && return 0
    [[ -f "$VOICE_CONF" ]] || return 1
    local enabled profile
    enabled=$(awk -F= '/^ENABLED=/{print tolower($2); exit}' "$VOICE_CONF")
    profile=$(awk -F= '/^PROFILE=/{print tolower($2); exit}' "$VOICE_CONF")
    [[ "$enabled" != "true" || "$profile" == "silent" || "$profile" == "focus" ]]
}

# Spoken alerts obey the global Voice Vibe switch; visual alerts remain active.
speak() {
    voice_is_muted && return 0
    /Users/alexanderanthony/.agents/speak_serialized.sh "$1" "P1" "Daniel"
}

# Visual notification as secondary layer
notify() {
    osascript -e "display notification \"$1\" with title \"Memory Guardian\" subtitle \"$2\"" 2>/dev/null
}

if [ "$FREE_MB" -lt 200 ]; then
    KILLED_SOMETHING=false

    # 1. Kill Docker VM first (heaviest, safest to kill)
    DOCKER_PID=$(pgrep -f "com.docker.virtualization" | head -1)
    if [ -n "$DOCKER_PID" ]; then
        kill "$DOCKER_PID" 2>/dev/null
        echo "[$TIMESTAMP] CRITICAL: ${FREE_MB}MB free — killed Docker VM (pid $DOCKER_PID)" >> "$LOG"
        speak "Warning. Only ${FREE_MB} megabytes free. Docker has been stopped to protect your system."
        notify "${FREE_MB}MB free — stopped Docker VM to protect system." "Critical: Low RAM"
        KILLED_SOMETHING=true
    fi

    # 2. Kill Ollama if running (large ML model server)
    OLLAMA_PID=$(pgrep -x "ollama" | head -1)
    if [ -n "$OLLAMA_PID" ]; then
        kill "$OLLAMA_PID" 2>/dev/null
        echo "[$TIMESTAMP] CRITICAL: ${FREE_MB}MB free — killed Ollama (pid $OLLAMA_PID)" >> "$LOG"
        speak "Warning. Only ${FREE_MB} megabytes free. Ollama has been stopped to protect your system."
        notify "${FREE_MB}MB free — stopped Ollama to protect system." "Critical: Low RAM"
        KILLED_SOMETHING=true
    fi

    # 3. Stop non-essential PM2 orchestrators (not the always-live APIs)
    for svc in TheOneSystem_v2.3 supernova one_system_voice; do
        if pm2 describe "$svc" 2>/dev/null | grep -q "online"; then
            pm2 stop "$svc" 2>/dev/null
            echo "[$TIMESTAMP] CRITICAL: ${FREE_MB}MB free — stopped PM2 service: $svc" >> "$LOG"
            KILLED_SOMETHING=true
        fi
    done

    if [ "$KILLED_SOMETHING" = false ]; then
        echo "[$TIMESTAMP] CRITICAL: ${FREE_MB}MB free — nothing safe to kill, notifying" >> "$LOG"
        speak "Critical warning. Only ${FREE_MB} megabytes of RAM remaining. Close applications immediately to prevent a system crash."
        notify "Only ${FREE_MB}MB RAM free. Close apps NOW to prevent a system crash." "CRITICAL WARNING"
    fi

elif [ "$FREE_MB" -lt 500 ]; then
    echo "[$TIMESTAMP] WARNING: ${FREE_MB}MB free" >> "$LOG"
    speak "Memory warning. ${FREE_MB} megabytes free. Consider closing unused apps."
    notify "${FREE_MB}MB RAM free. Consider closing unused apps or tabs." "Memory Warning"

elif [ "$FREE_MB" -lt 1000 ]; then
    echo "[$TIMESTAMP] LOW: ${FREE_MB}MB free" >> "$LOG"
fi
