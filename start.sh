#!/usr/bin/env bash

# ─────────────────────────────────────────────────────────────────────────────
#  start.sh — Start Stock Assistant (Brain) and OpenStock together
#
#  Usage:
#    ./start.sh              Start in foreground (Ctrl+C kills all)
#    ./start.sh -d           Start in background (run ./kill.sh to stop)
#    ./start.sh --all        Start Brain backend, OpenStock, AND stock-analyzer UI
# ─────────────────────────────────────────────────────────────────────────────

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.pids"
LOGS_DIR="$ROOT_DIR/.logs"

# Ensure Node/NPM from NVM or system is in PATH
if ! command -v npm &>/dev/null; then
  if [ -d "$HOME/.nvm/versions/node/v24.15.0/bin" ]; then
    export PATH="$HOME/.nvm/versions/node/v24.15.0/bin:$PATH"
  elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    source "$NVM_DIR/nvm.sh" 2>/dev/null || true
  fi
fi

# Ensure Cargo/local bin for uv/python is in PATH
[ -d "$HOME/.cargo/bin" ] && export PATH="$HOME/.cargo/bin:$PATH"
[ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"

DAEMON_MODE=false
START_ALL=false

for arg in "$@"; do
  case "$arg" in
    -d|--daemon|--background)
      DAEMON_MODE=true
      ;;
    -a|--all)
      START_ALL=true
      ;;
    -h|--help)
      echo "Usage: ./start.sh [-d|--daemon] [-a|--all]"
      echo "  -d, --daemon    Run processes in background"
      echo "  -a, --all       Also launch stock-analyzer's standalone frontend"
      exit 0
      ;;
  esac
done

# Clean up any previous dead/stray processes on ports 8000 & 3000
if [ -f "$ROOT_DIR/kill.sh" ]; then
  "$ROOT_DIR/kill.sh" --silent 2>/dev/null || true
fi

mkdir -p "$LOGS_DIR"
rm -f "$PID_FILE"

# Trap Ctrl+C (SIGINT) and SIGTERM for foreground mode
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  if [ -f "$ROOT_DIR/kill.sh" ]; then
    "$ROOT_DIR/kill.sh"
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "=========================================================="
echo "  🚀 Starting Stonks Ecosystem (Model A Microservice)"
echo "=========================================================="

# 1. Start Stock Assistant Backend (FastAPI Brain)
echo "🧠 [1/2] Starting Stock Assistant Brain (Port 8000)..."
cd "$ROOT_DIR/stock-analyzer/backend"

# Detect and heal broken/stale virtualenv if the project was moved
if [ -d ".venv" ]; then
  CURRENT_INTERPRETER="$(head -n 1 .venv/bin/uvicorn 2>/dev/null || true)"
  if [[ "$CURRENT_INTERPRETER" != *"$ROOT_DIR"* ]] || [ ! -e ".venv/bin/python3" ]; then
    echo "⚠️  Detected broken virtualenv paths from previous directory move."
    echo "🔄 Refreshing .venv with uv sync..."
    if command -v uv &>/dev/null; then
      rm -rf .venv
      uv sync
    fi
  fi
fi

START_BACKEND_CMD=""
if command -v uv &>/dev/null; then
  START_BACKEND_CMD="uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
elif [ -f ".venv/bin/uvicorn" ]; then
  START_BACKEND_CMD=".venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
else
  START_BACKEND_CMD="python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
fi

if [ "$DAEMON_MODE" = true ]; then
  $START_BACKEND_CMD > "$LOGS_DIR/brain.log" 2>&1 &
  BACKEND_PID=$!
else
  $START_BACKEND_CMD &
  BACKEND_PID=$!
fi
echo "$BACKEND_PID" >> "$PID_FILE"

# 2. Start OpenStock (Next.js Platform)
echo "📈 [2/2] Starting OpenStock (Port 3000)..."
cd "$ROOT_DIR/OpenStock"

if [ "$DAEMON_MODE" = true ]; then
  npm run dev > "$LOGS_DIR/openstock.log" 2>&1 &
  OPENSTOCK_PID=$!
else
  npm run dev &
  OPENSTOCK_PID=$!
fi
echo "$OPENSTOCK_PID" >> "$PID_FILE"

# 3. Optional: Start stock-analyzer frontend
if [ "$START_ALL" = true ]; then
  echo "🖥️  [3/3] Starting stock-analyzer frontend (Port 3001)..."
  cd "$ROOT_DIR/stock-analyzer/frontend"
  if [ "$DAEMON_MODE" = true ]; then
    PORT=3001 npm run dev > "$LOGS_DIR/analyzer_frontend.log" 2>&1 &
    ANALYZER_FE_PID=$!
  else
    PORT=3001 npm run dev &
    ANALYZER_FE_PID=$!
  fi
  echo "$ANALYZER_FE_PID" >> "$PID_FILE"
fi

echo ""
echo "=========================================================="
echo "  ✅ Services started!"
echo "  • OpenStock Web App:   http://localhost:3000"
echo "  • Brain REST API docs: http://localhost:8000/docs"
if [ "$START_ALL" = true ]; then
  echo "  • Stock Analyzer UI:   http://localhost:3001"
fi
if [ "$DAEMON_MODE" = true ]; then
  echo ""
  echo "  Running in background."
  echo "  • Logs:       $LOGS_DIR/"
  echo "  • Stop with:  ./kill.sh"
  echo "=========================================================="
else
  echo ""
  echo "  Press CTRL+C anytime to stop all services."
  echo "=========================================================="
  wait
fi

