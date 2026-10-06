#!/bin/bash
# open_preview.sh - Unified multi-modal preview launcher for One System UI and media artifacts.
# Bypasses browser CORS restrictions by auto-hosting via local preview server (port 8888)
# while preserving direct file access. Automatically wraps audio and video in interactive HTML5 players.

PORT=8888
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-dashboard/dist/index.html}"

# Resolve target absolute path
if [[ "$TARGET" = /* ]]; then
  ABS_PATH="$TARGET"
else
  ABS_PATH="$(pwd)/$TARGET"
fi

if command -v python3 >/dev/null 2>&1; then
  ABS_PATH=$(python3 -c "import os, sys; print(os.path.abspath(sys.argv[1]))" "$TARGET" 2>/dev/null || echo "$ABS_PATH")
fi

if [ ! -e "$ABS_PATH" ]; then
  echo "[ERROR] Preview target does not exist: $ABS_PATH"
  exit 1
fi

EXT="${ABS_PATH##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

# Automatic wrapper for audio files
if [[ "$EXT_LOWER" =~ ^(wav|mp3|m4a|aac|flac|ogg)$ ]]; then
  echo "[MEDIA] Audio asset detected. Synthesizing Cyberpunk Audio Player..."
  PLAYER_PATH=$(python3 "$BASE_DIR/scripts/preview_engine.py" audio "$ABS_PATH" --json 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('player_html', ''))" 2>/dev/null)
  if [ -n "$PLAYER_PATH" ] && [ -f "$PLAYER_PATH" ]; then
    ABS_PATH="$PLAYER_PATH"
  fi
fi

# Automatic wrapper for video files
if [[ "$EXT_LOWER" =~ ^(mp4|mov|webm|avi|mkv)$ ]]; then
  echo "[MEDIA] Video asset detected. Synthesizing Cyberpunk Frame-Stepper Player..."
  PLAYER_PATH=$(python3 "$BASE_DIR/scripts/preview_engine.py" video "$ABS_PATH" --json 2>/dev/null | python3 -c "import sys, json; print(json.load(sys.stdin).get('player_html', ''))" 2>/dev/null)
  if [ -n "$PLAYER_PATH" ] && [ -f "$PLAYER_PATH" ]; then
    ABS_PATH="$PLAYER_PATH"
  fi
fi

is_port_in_use() {
  nc -z localhost "$PORT" >/dev/null 2>&1
}

# If target is inside BASE_DIR, route through HTTP preview server to bypass CORS for ES modules
if [[ "$ABS_PATH" == "$BASE_DIR"* ]]; then
  REL_PATH="${ABS_PATH#$BASE_DIR/}"
  
  if ! is_port_in_use; then
    echo "[INFRA] Starting local preview server on port $PORT..."
    nohup python3 -m http.server "$PORT" --directory "$BASE_DIR" > /tmp/workspace_http_server.log 2>&1 &
    sleep 1.5
  fi

  HTTP_URL="http://localhost:$PORT/$REL_PATH"
  FILE_URL="file://$ABS_PATH"
  
  echo "========================================="
  echo "Preview Ready:"
  echo "  HTTP URL (CORS Safe): $HTTP_URL"
  echo "  Direct File Link:     $FILE_URL"
  echo "========================================="
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening $HTTP_URL in default browser..."
    open "$HTTP_URL"
  else
    echo "Please open $HTTP_URL in your browser."
  fi
else
  FILE_URL="file://$ABS_PATH"
  echo "Opening $FILE_URL..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$FILE_URL"
  fi
fi