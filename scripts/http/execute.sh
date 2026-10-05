#!/bin/bash
# Execute System Directive
# Example: ./execute.sh "ANALYZE advanced framework"
COMMAND=${1:-"ANALYZE multi-agent framework"}
TRACE_ID="http-$(date +%s)"

echo "--- Executing Directive: $COMMAND ---"
http POST localhost:8001/command \
    command="$COMMAND" \
    trace_id="$TRACE_ID"
