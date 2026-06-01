#!/bin/bash
# Open UI index.html with Chrome allowing local file fetches for telemetry data
TARGET="${1:-dashboard/dist/index.html}"

# Resolve absolute path
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  ABS_PATH=$(python3 -c "import os, sys; print(os.path.abspath(sys.argv[1]))" "$TARGET")
  echo "Opening $ABS_PATH in Google Chrome with local file permissions..."
  open -a "Google Chrome" --args --allow-file-access-from-files "file://$ABS_PATH"
else
  echo "Unsupported OS type: $OSTYPE. Please open file://$TARGET manually in Chrome with --allow-file-access-from-files"
fi
