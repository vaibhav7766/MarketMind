#!/usr/bin/env bash

# ─────────────────────────────────────────────
#  start.sh — Start frontend & backend together
#  CTRL+C kills both processes forcefully (SIGKILL)
# ─────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Store child PIDs
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "🛑 Stopping all processes..."

  [ -n "$BACKEND_PID" ]  && kill -9 "$BACKEND_PID"  2>/dev/null
  [ -n "$FRONTEND_PID" ] && kill -9 "$FRONTEND_PID" 2>/dev/null

  # Also kill any child processes spawned by them
  pkill -9 -P "$BACKEND_PID"  2>/dev/null
  pkill -9 -P "$FRONTEND_PID" 2>/dev/null

  echo "✅ All processes killed."
  exit 0
}

# Trap CTRL+C (SIGINT) and forcefully kill everything
trap cleanup SIGINT SIGTERM

echo "🚀 Starting backend  (FastAPI / uvicorn)..."
cd "$ROOT_DIR/backend"
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo "🚀 Starting frontend (Next.js)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "─────────────────────────────────────────"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo "  Press CTRL+C to stop both."
echo "─────────────────────────────────────────"
echo ""

# Wait for either process to exit
wait
