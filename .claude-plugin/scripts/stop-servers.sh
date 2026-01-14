#!/bin/bash

if [ -f /tmp/local-review.pid ]; then
  PID=$(cat /tmp/local-review.pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" 2>/dev/null || true
    # Also kill child processes
    pkill -P "$PID" 2>/dev/null || true
  fi
  rm -f /tmp/local-review.pid
fi
