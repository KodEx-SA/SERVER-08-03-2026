#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  IMS — Intern Management System
#  Launch Script for Linux (Ubuntu / Linux Mint)
#  Usage:  ./launch.sh
#          ./launch.sh --stop     ← kill running servers
#          ./launch.sh --logs     ← tail live logs
# ═══════════════════════════════════════════════════════════════════

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$APP_DIR/logs"
SERVER_LOG="$LOG_DIR/server.log"
CLIENT_LOG="$LOG_DIR/client.log"
PID_FILE="$APP_DIR/.ims.pids"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

banner() {
  echo ""
  echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════╗${RESET}"
  echo -e "${BLUE}${BOLD}║   IMS — Intern Management System         ║${RESET}"
  echo -e "${BLUE}${BOLD}║   Eullafied Tech Solutions               ║${RESET}"
  echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════╝${RESET}"
  echo ""
}

# ── Stop ──────────────────────────────────────────────────────────
stop_servers() {
  if [ -f "$PID_FILE" ]; then
    echo -e "${YELLOW}Stopping IMS servers...${RESET}"
    while IFS= read -r pid; do
      if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null
        echo -e "  ${RED}✕${RESET} Stopped process $pid"
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
    echo -e "${GREEN}✓ All servers stopped.${RESET}"
  else
    echo -e "${YELLOW}No running IMS servers found.${RESET}"
  fi
}

# ── Tail logs ─────────────────────────────────────────────────────
show_logs() {
  if [ ! -f "$SERVER_LOG" ] && [ ! -f "$CLIENT_LOG" ]; then
    echo -e "${RED}No log files found. Start IMS first with ./launch.sh${RESET}"
    exit 1
  fi
  echo -e "${BLUE}Tailing IMS logs (Ctrl+C to exit)...${RESET}"
  tail -f "$SERVER_LOG" "$CLIENT_LOG"
}

# ── Argument handling ──────────────────────────────────────────────
if [ "$1" == "--stop" ]; then
  banner; stop_servers; exit 0
fi
if [ "$1" == "--logs" ]; then
  banner; show_logs; exit 0
fi

# ── Pre-flight checks ──────────────────────────────────────────────
banner

echo -e "${BOLD}Running pre-flight checks...${RESET}"

# Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}✕ Node.js is not installed. Please install Node.js 20+.${RESET}"
  exit 1
fi
NODE_VER=$(node -v)
echo -e "  ${GREEN}✓${RESET} Node.js $NODE_VER"

# .env file
if [ ! -f "$APP_DIR/.env" ]; then
  echo -e "${RED}✕ .env file not found!${RESET}"
  echo -e "  Create one based on .env.example or add:"
  echo -e "  ${YELLOW}JWT_SECRET=<64-char-hex>${RESET}"
  echo -e "  ${YELLOW}ALLOWED_ORIGINS=http://localhost:5173${RESET}"
  echo -e "  Generate secret: ${YELLOW}node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"${RESET}"
  exit 1
fi
echo -e "  ${GREEN}✓${RESET} .env file found"

# node_modules
if [ ! -d "$APP_DIR/node_modules" ]; then
  echo -e "  ${YELLOW}⚠ node_modules missing — running npm install...${RESET}"
  cd "$APP_DIR" && npm install --silent
  echo -e "  ${GREEN}✓${RESET} Dependencies installed"
else
  echo -e "  ${GREEN}✓${RESET} Dependencies present"
fi

# Kill any stale servers
stop_servers 2>/dev/null
mkdir -p "$LOG_DIR"

# ── Start backend ──────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Starting servers...${RESET}"

cd "$APP_DIR"
node --env-file=.env server/index.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Wait up to 5s for server to be ready
SERVER_READY=false
for i in {1..10}; do
  sleep 0.5
  if grep -q "Server running" "$SERVER_LOG" 2>/dev/null; then
    SERVER_READY=true
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo -e "  ${RED}✕ Backend crashed! Check logs:${RESET}"
    tail -20 "$SERVER_LOG"
    exit 1
  fi
done

if [ "$SERVER_READY" = true ]; then
  echo -e "  ${GREEN}✓${RESET} Backend running   → ${BOLD}http://localhost:3001/api${RESET}"
else
  echo -e "  ${YELLOW}⚠${RESET} Backend started (slow to confirm)   → http://localhost:3001/api"
fi

# ── Start frontend ─────────────────────────────────────────────────
npm run dev > "$CLIENT_LOG" 2>&1 &
CLIENT_PID=$!
echo "$CLIENT_PID" >> "$PID_FILE"

# Wait up to 8s for Vite to be ready
CLIENT_READY=false
CLIENT_URL="http://localhost:5173"
for i in {1..16}; do
  sleep 0.5
  if grep -qE "Local:.*http" "$CLIENT_LOG" 2>/dev/null; then
    CLIENT_URL=$(grep -oE "http://localhost:[0-9]+" "$CLIENT_LOG" | head -1)
    CLIENT_READY=true
    break
  fi
done

if [ "$CLIENT_READY" = true ]; then
  echo -e "  ${GREEN}✓${RESET} Frontend running   → ${BOLD}$CLIENT_URL${RESET}"
else
  echo -e "  ${YELLOW}⚠${RESET} Frontend starting  → http://localhost:5173"
fi

# ── Summary ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  IMS is running!${RESET}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════${RESET}"
echo ""
echo -e "  🌐  Open in browser:  ${BOLD}$CLIENT_URL${RESET}"
echo -e "  🔌  API base:         ${BOLD}http://localhost:3001/api${RESET}"
echo ""
echo -e "  👤  Super Admin:  ${YELLOW}superadmin@internsystem.com${RESET} / ${YELLOW}Admin@123${RESET}"
echo -e "  🧑  Test Intern:  ${YELLOW}intern@eullafied.co.za${RESET}     / ${YELLOW}Intern@123${RESET}"
echo ""
echo -e "  📄  Logs:   ${BLUE}$LOG_DIR/${RESET}"
echo -e "  🛑  Stop:   ${BOLD}./launch.sh --stop${RESET}"
echo -e "  📋  Tail:   ${BOLD}./launch.sh --logs${RESET}"
echo ""

# ── Open browser (optional) ────────────────────────────────────────
if command -v xdg-open &>/dev/null; then
  sleep 1
  xdg-open "$CLIENT_URL" &>/dev/null &
fi

# Keep script alive so Ctrl+C kills both servers cleanly
trap 'echo -e "\n${YELLOW}Shutting down IMS...${RESET}"; stop_servers; exit 0' SIGINT SIGTERM

echo -e "${BLUE}Press Ctrl+C to stop all servers.${RESET}"
echo ""
wait
