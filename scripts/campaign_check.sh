#!/bin/bash
# Icyflamze Creative OS: Safe Campaign Check Routine
# Reads repository signals and pipeline items from local database to monitor status.

echo "[$(date)] Initializing campaign-check routine..."
echo "[$(date)] Querying local telemetry..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="${SUPERNOVA_DB_PATH:-$SCRIPT_DIR/../supernova.db}"

if [ -f "$DB_PATH" ]; then
    sqlite3 "$DB_PATH" "SELECT timestamp, signal_type, payload FROM repo_signals ORDER BY timestamp DESC LIMIT 3;" 2>/dev/null
    echo "[$(date)] DB Query complete."
else
    echo "[$(date)] No database found. Mocking signals."
    echo "2026-05-30 09:00:00 | CAMPAIGN_CHECK | Active: 2 | Conversion: Stable"
fi

echo "[$(date)] Campaign check completed successfully."
exit 0
