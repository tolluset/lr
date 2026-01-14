#!/bin/bash
set -e

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$0")")}"
PROJECT_ROOT="$PLUGIN_ROOT/.."
cd "$PROJECT_ROOT"

# Check if already running
if [ -f /tmp/local-review.pid ]; then
  PID=$(cat /tmp/local-review.pid)
  if kill -0 "$PID" 2>/dev/null; then
    exit 0
  fi
fi

# Start dev server in background
pnpm dev > /tmp/local-review.log 2>&1 &
DEV_PID=$!
echo $DEV_PID > /tmp/local-review.pid

# Wait for server to start (max 15 seconds)
for i in {1..15}; do
  if curl -s http://localhost:6776/api/sessions > /dev/null 2>&1; then
    # Open web UI in browser
    if command -v open &> /dev/null; then
      open http://localhost:6777
    elif command -v xdg-open &> /dev/null; then
      xdg-open http://localhost:6777
    fi
    exit 0
  fi
  sleep 1
done

echo "Warning: Could not verify server startup"
