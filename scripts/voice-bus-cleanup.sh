#!/bin/bash
# voice-bus-cleanup.sh - Cleanup old Voice Bus artifacts and rotate logs v3
# Cleans stale deferred jobs, orphaned chunk files, and interrupted state files.

QUEUE_DIR="/tmp/voice_bus_queue"
ARCHIVE_DIR="/Users/alexanderanthony/reports/voice/full-narration"
LOG_FILE="/Users/alexanderanthony/logs/voice/voice-bus.log"

echo "=== 🧹 Starting Voice Bus Cleanup v3 ==="

deleted_queue_files=0
deleted_archives=0

# 1. Clean completed/orphaned queue files older than 24 hours (1440 minutes)
# This includes: stale deferred jobs (*.job), text files (text-*), state files (*.state), and chunk files.
if [ -d "$QUEUE_DIR" ]; then
    while read -r file; do
        if [ -f "$file" ]; then
            # Do not delete files marked KEEP in filename or content
            if [[ "$(basename "$file")" == *"KEEP"* ]] || grep -q "KEEP" "$file" 2>/dev/null; then
                echo "Skipping KEEP-marked queue file: $(basename "$file")"
                continue
            fi
            rm -f "$file"
            deleted_queue_files=$((deleted_queue_files + 1))
        fi
    done < <(find "$QUEUE_DIR" -type f -mmin +1440 2>/dev/null)
fi
echo "Cleaned $deleted_queue_files orphaned queue/deferred/state/chunk files older than 24 hours."

# 2. Clean archived full narration markdown files older than 14 days
if [ -d "$ARCHIVE_DIR" ]; then
    while read -r file; do
        # Do not delete files marked KEEP in filename or content
        if [[ "$(basename "$file")" == *"KEEP"* ]] || grep -q "KEEP" "$file" 2>/dev/null; then
            echo "Skipping KEEP-marked archive: $(basename "$file")"
            continue
        fi
        rm -f "$file"
        deleted_archives=$((deleted_archives + 1))
    done < <(find "$ARCHIVE_DIR" -type f -name "*.md" -mtime +14 2>/dev/null)
fi
echo "Cleaned $deleted_archives archived full narrations older than 14 days."

# 3. Rotate logs if exceeding 1MB (1,000,000 bytes)
log_rotated="No"
if [ -f "$LOG_FILE" ]; then
    file_size=$(stat -f %z "$LOG_FILE" 2>/dev/null || echo 0)
    if [ "$file_size" -gt 1000000 ]; then
        # Keep last 1000 lines
        tail -n 1000 "$LOG_FILE" > "${LOG_FILE}.tmp" 2>/dev/null
        if [ -s "${LOG_FILE}.tmp" ]; then
            mv "${LOG_FILE}.tmp" "$LOG_FILE"
            log_rotated="Yes (trimmed to last 1000 lines)"
        else
            rm -f "${LOG_FILE}.tmp"
        fi
    fi
fi
echo "Log Rotated: $log_rotated"

echo "=== Cleanup Summary Complete ==="
exit 0
