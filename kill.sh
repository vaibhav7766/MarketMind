#!/usr/bin/env bash

# ─────────────────────────────────────────────────────────────────────────────
#  kill.sh — Forcefully stop all running Stonks services and free up ports
# ─────────────────────────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.pids"
SILENT=false

if [ "$1" = "--silent" ] || [ "$1" = "-s" ]; then
  SILENT=true
fi

log() {
  if [ "$SILENT" = false ]; then
    echo "$@"
  fi
}

log "🛑 Stopping Stonks services..."

# 1. Kill tracked PIDs from .pids file
if [ -f "$PID_FILE" ]; then
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
      pkill -9 -P "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

# 2. Kill by port (8000 for Brain, 3000 for OpenStock, 3001 for standalone UI)
PORTS=(8000 3000 3001)
for port in "${PORTS[@]}"; do
  # Try lsof
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
  # Fallback to fuser
  fuser -k -9 "$port/tcp" 2>/dev/null || true
done

# 3. Kill lingering named processes
pkill -9 -f "uvicorn app.main:app" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

log "✅ All services stopped. Ports 8000, 3000, and 3001 are clear."

