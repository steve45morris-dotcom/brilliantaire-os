#!/bin/bash
# voice-queue-status.sh - Check current Voice Bus queue state v3
# Displays active job details, queue counts, priorities, and interruption states.

QUEUE_DIR="/tmp/voice_bus_queue"
LOCKDIR="/tmp/say_speak.lock"
LOG_FILE="/Users/alexanderanthony/logs/voice/voice-bus.log"

echo "=== 🎙️ Voice Bus Queue Status ==="

# 1. Lock status
if [ -d "$LOCKDIR" ]; then
    echo "Lock Status: LOCKED (/tmp/say_speak.lock exists)"
else
    echo "Lock Status: UNLOCKED"
fi

# 2. Active say process count
SAY_COUNT=$(pgrep -x say | wc -l | tr -d ' ')
echo "Active say Processes: $SAY_COUNT"

# 3. Active Job State
ACTIVE_REQ_ID="None"
ACTIVE_PRIORITY="None"
ACTIVE_CHUNK_INDEX="None"
ACTIVE_POLICY="None"
ACTIVE_TOTAL_CHUNKS="None"

if [ -f "$QUEUE_DIR/active_job.state" ]; then
    # Parse state safely without executing unknown code
    ACTIVE_REQ_ID=$(grep "^ACTIVE_REQ_ID=" "$QUEUE_DIR/active_job.state" | cut -d'"' -f2)
    ACTIVE_PRIORITY=$(grep "^ACTIVE_PRIORITY=" "$QUEUE_DIR/active_job.state" | cut -d'"' -f2)
    ACTIVE_CHUNK_INDEX=$(grep "^ACTIVE_CHUNK_INDEX=" "$QUEUE_DIR/active_job.state" | cut -d'"' -f2)
    ACTIVE_POLICY=$(grep "^ACTIVE_POLICY=" "$QUEUE_DIR/active_job.state" | cut -d'"' -f2)
    ACTIVE_TOTAL_CHUNKS=$(grep "^TOTAL_CHUNKS=" "$QUEUE_DIR/active_job.state" | cut -d'"' -f2)
fi

echo "Active Job ID: $ACTIVE_REQ_ID"
echo "Active Job Priority: $ACTIVE_PRIORITY"
if [ "$ACTIVE_CHUNK_INDEX" != "None" -a "$ACTIVE_TOTAL_CHUNKS" != "None" ]; then
    echo "Active Chunk Index: $((ACTIVE_CHUNK_INDEX + 1)) of $ACTIVE_TOTAL_CHUNKS"
else
    echo "Active Chunk Index: None"
fi
echo "Active Interruption Policy: $ACTIVE_POLICY"

# 4. Queue metrics
JOB_COUNT=$(ls "$QUEUE_DIR"/P*.job 2>/dev/null | wc -l | tr -d ' ')
DEFERRED_COUNT=$(grep -l '^DEFERRED="true"' "$QUEUE_DIR"/P*.job 2>/dev/null | wc -l | tr -d ' ')

TOTAL_P1=$(ls "$QUEUE_DIR"/P1-*.job 2>/dev/null | wc -l | tr -d ' ')
ACTIVE_IS_P1=0
if [ "$ACTIVE_PRIORITY" = "P1" ]; then
    ACTIVE_IS_P1=1
fi
WAITING_P1_COUNT=$((TOTAL_P1 - ACTIVE_IS_P1))
if [ "$WAITING_P1_COUNT" -lt 0 ]; then WAITING_P1_COUNT=0; fi

echo "Queued Jobs Count: $JOB_COUNT"
echo "Deferred Jobs Count: $DEFERRED_COUNT"
echo "Waiting P1 Jobs Count: $WAITING_P1_COUNT"

# 5. Count by priority
if [ "$JOB_COUNT" -gt 0 ]; then
    echo "Queue Breakdown by Priority:"
    for p in P1 P2 P3 P4; do
        p_count=$(ls "$QUEUE_DIR"/${p}-*.job 2>/dev/null | wc -l | tr -d ' ')
        echo "  - $p: $p_count"
    done
fi

# 6. Oldest queued job
if [ "$JOB_COUNT" -gt 0 ]; then
    oldest_job=$(ls "$QUEUE_DIR"/P*.job 2>/dev/null | sort | head -n 1)
    echo "Oldest Queued Job: $(basename "$oldest_job")"
    if [ -f "$oldest_job" ]; then
        echo "  - Details:"
        grep -E "^(PRIORITY|TIMESTAMP|CALLER|PID|DEFERRED|INTERRUPT_POLICY)=" "$oldest_job" | sed 's/^/    /'
    fi
fi

# 7. Most recent voice-bus log line
if [ -f "$LOG_FILE" ]; then
    echo "Most Recent Log Line:"
    tail -n 1 "$LOG_FILE" | sed 's/^/  /'
else
    echo "No Log File Found at $LOG_FILE"
fi

echo "================================="
exit 0
