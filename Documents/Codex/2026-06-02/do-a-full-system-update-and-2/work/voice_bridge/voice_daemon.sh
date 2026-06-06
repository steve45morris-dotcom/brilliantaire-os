#!/bin/bash

BUFFER="${VOICE_BUFFER:-/Users/alexanderanthony/.agents/voice_buffer.txt}"
MUTED_ARCHIVE_DIR="${VOICE_MUTED_ARCHIVES:-/Users/alexanderanthony/.agents/muted_voice_reports}"
MUTE_MARKER="${VOICE_MUTE_MARKER:-/tmp/.supernova_voice_muted}"
VOICE_CONF="${VOICE_CONF:-/Users/alexanderanthony/.claude/voice/voice.conf}"
INTELLIGENCE_ENGINE="${VOICE_INTELLIGENCE_ENGINE:-/Users/alexanderanthony/scripts/voice_intelligence.py}"
POLICY_PYTHON="${VOICE_POLICY_PYTHON:-/usr/bin/python3}"
DIGEST_STATE="${VOICE_DIGEST_STATE:-/tmp/.supernova_voice_digest.json}"
LOCK="${VOICE_DAEMON_LOCK:-/tmp/voice_daemon.lock}"
LOG="${VOICE_DAEMON_LOG:-/Users/alexanderanthony/supernova/logs/voice_daemon.log}"
RUN_ONCE="${VOICE_DAEMON_ONCE:-0}"
IDLE_POLL_SECONDS="${VOICE_IDLE_POLL_SECONDS:-10}"
ACTIVE_POLL_SECONDS="${VOICE_ACTIVE_POLL_SECONDS:-2}"

mkdir -p "$(dirname "$LOG")"
echo "[$(date)] Voice Daemon starting..." >> "$LOG"

if [[ -f "$LOCK" ]]; then
    PID=$(cat "$LOCK")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "[$(date)] Voice Daemon already running with PID $PID. Exiting." >> "$LOG"
        exit 0
    fi
fi

echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

voice_is_muted() {
    [[ -f "$MUTE_MARKER" ]] && return 0
    [[ -f "$VOICE_CONF" ]] || return 1
    local enabled="" profile="" key value
    while IFS='=' read -r key value; do
        case "$key" in
            ENABLED) enabled="$value" ;;
            PROFILE) profile="$value" ;;
        esac
    done < "$VOICE_CONF"
    case "$enabled" in
        [Tt][Rr][Uu][Ee]) ;;
        *) return 0 ;;
    esac
    case "$profile" in
        [Ss][Ii][Ll][Ee][Nn][Tt]|[Ff][Oo][Cc][Uu][Ss]) return 0 ;;
    esac
    return 1
}

has_pending_digest() {
    [[ -f "$DIGEST_STATE" ]] || return 1
    local payload
    payload=$(<"$DIGEST_STATE")
    [[ -n "$payload" && "$payload" != "[]" ]]
}

archive_muted_reports() {
    [[ -f "$BUFFER" && -s "$BUFFER" ]] || return 0
    mkdir -p "$MUTED_ARCHIVE_DIR"
    local archive
    archive="$MUTED_ARCHIVE_DIR/$(date '+%Y-%m-%d').log"
    cat "$BUFFER" >> "$archive"
    : > "$BUFFER"
    echo "[$(date)] Archived muted voice reports to $archive" >> "$LOG"
}

remove_first_queue_line() {
    local temporary="${BUFFER}.tmp.$$"
    tail -n +2 "$BUFFER" > "$temporary"
    mv "$temporary" "$BUFFER"
}

json_field() {
    local payload="$1"
    local field="$2"
    "$POLICY_PYTHON" -c \
        'import json, sys; value=json.loads(sys.argv[1]).get(sys.argv[2], ""); print(value if value is not None else "")' \
        "$payload" "$field"
}

record_spoken() {
    local payload="$1"
    local speech="$2"
    local digests=()
    while IFS= read -r digest; do
        [[ -n "$digest" ]] && digests+=("$digest")
    done < <(
        "$POLICY_PYTHON" -c \
            'import json, sys; print("\n".join(json.loads(sys.argv[1]).get("source_digests", [])))' \
            "$payload"
    )
    VOICE_CONF="$VOICE_CONF" \
    VOICE_BUFFER="$BUFFER" \
    VOICE_INTELLIGENCE_STATE="${VOICE_INTELLIGENCE_STATE:-/tmp/.supernova_voice_intelligence.json}" \
    VOICE_DIGEST_STATE="$DIGEST_STATE" \
    VOICE_INTELLIGENCE_ARCHIVES="${VOICE_INTELLIGENCE_ARCHIVES:-/Users/alexanderanthony/.agents/voice_intelligence_archives}" \
        "$POLICY_PYTHON" "$INTELLIGENCE_ENGINE" spoken "$speech" "${digests[@]}" >> "$LOG" 2>&1
}

speak_text() {
    local speech="$1"
    voice_is_muted && return 1
    if [[ -n "${VOICE_SPEAK_COMMAND:-}" ]]; then
        "$VOICE_SPEAK_COMMAND" "$speech"
        return $?
    fi
    if /Users/alexanderanthony/venv_stable/bin/python \
        /Users/alexanderanthony/scripts/vv_speak.py "$speech" --play >> "$LOG" 2>&1; then
        return 0
    fi
    voice_is_muted && return 1
    /usr/bin/say "$speech"
}

evaluate_policy() {
    local command="$1"
    shift
    VOICE_CONF="$VOICE_CONF" \
    VOICE_BUFFER="$BUFFER" \
    VOICE_INTELLIGENCE_STATE="${VOICE_INTELLIGENCE_STATE:-/tmp/.supernova_voice_intelligence.json}" \
    VOICE_DIGEST_STATE="$DIGEST_STATE" \
    VOICE_INTELLIGENCE_ARCHIVES="${VOICE_INTELLIGENCE_ARCHIVES:-/Users/alexanderanthony/.agents/voice_intelligence_archives}" \
        "$POLICY_PYTHON" "$INTELLIGENCE_ENGINE" "$command" "$@"
}

process_decision() {
    local decision="$1"
    local action speech
    action=$(json_field "$decision" "action")
    echo "[$(date)] Intelligence action: $action" >> "$LOG"
    [[ "$action" == "speak" ]] || return 0
    speech=$(json_field "$decision" "speech")
    [[ -n "$speech" ]] || return 0
    if speak_text "$speech"; then
        record_spoken "$decision" "$speech"
    fi
}

while true; do
    POLL_SECONDS="$IDLE_POLL_SECONDS"
    if voice_is_muted; then
        archive_muted_reports
    elif [[ -f "$BUFFER" && -s "$BUFFER" ]]; then
        POLL_SECONDS="$ACTIVE_POLL_SECONDS"
        LINE=$(head -n 1 "$BUFFER")
        if [[ -n "$LINE" ]]; then
            DECISION=$(evaluate_policy evaluate "$LINE")
            remove_first_queue_line
            process_decision "$DECISION"
        fi
    elif has_pending_digest; then
        DECISION=$(evaluate_policy flush)
        process_decision "$DECISION"
    fi

    [[ "$RUN_ONCE" == "1" ]] && break
    sleep "$POLL_SECONDS"
done
