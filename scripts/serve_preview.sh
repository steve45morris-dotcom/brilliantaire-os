#!/bin/bash
# serve_preview.sh - Start a local HTTP server to bypass browser CORS blocks on file:// URIs.
# Evolved under the Sovereign Architect-Core protocol.

PORT=8888
WORKSPACE_DIR="/Users/alexanderanthony"

is_port_in_use() {
    nc -z localhost "$PORT" >/dev/null 2>&1
}

echo "=== ONE SYSTEM PREVIEW HOST ==="

if is_port_in_use; then
    echo "[INFO] Port $PORT is already active."
    PID=$(lsof -t -i:"$PORT" || true)
    if [ -n "$PID" ]; then
        echo "[INFO] Live server detected (PID: $PID) on port $PORT."
    fi
else
    echo "[INFRA] Starting local HTTP server on port $PORT..."
    nohup python3 -m http.server "$PORT" --directory "$WORKSPACE_DIR" > /tmp/workspace_http_server.log 2>&1 &
    
    # Wait for start
    sleep 1.5
    
    if is_port_in_use; then
        echo "[OK] Local HTTP server started successfully on port $PORT."
    else
        echo "[ERROR] Failed to start HTTP server. Check log at /tmp/workspace_http_server.log"
        exit 1
    fi
fi

# Print live links
echo ""
echo "Live Dashboard Portal:"
echo "👉 http://localhost:$PORT/Landing%20Page%20Sites.html"
echo ""

# Launch browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening preview hub in default browser..."
    open "http://localhost:$PORT/Landing%20Page%20Sites.html"
else
    echo "Please open http://localhost:$PORT/Landing%20Page%20Sites.html manually."
fi
