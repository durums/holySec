#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
  exit 1
fi


echo ""
echo "  ██╗  ██╗ ██████╗ ██╗  ██╗   ██╗███████╗███████╗ ██████╗"
echo "  ██║  ██║██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝██╔════╝██╔════╝"
echo "  ███████║██║   ██║██║   ╚████╔╝ ███████╗█████╗  ██║"
echo "  ██╔══██║██║   ██║██║    ╚██╔╝  ╚════██║██╔══╝  ██║"
echo "  ██║  ██║╚██████╔╝███████╗██║   ███████║███████╗╚██████╗"
echo "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚══════╝ ╚═════╝"
echo ""

# ── Frontend-Abhängigkeiten ────────────────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "  [holySec] Frontend-Abhängigkeiten installieren..."
  npm install
fi

# ── Backend-Abhängigkeiten ────────────────────────────────────────────────────
if [ ! -d "backend/node_modules" ]; then
  echo "  [holySec] Backend-Abhängigkeiten installieren..."
  (cd backend && npm install)
fi

# ── Alte Prozesse beenden ─────────────────────────────────────────────────────
for PORT in 5173 3001; do
  if fuser $PORT/tcp &>/dev/null; then
    echo "  [holySec] Port $PORT belegt — beende alten Prozess..."
    fuser -k $PORT/tcp &>/dev/null
    sleep 0.5
  fi
done

# ── Backend auf Port 3001 starten (API) ──────────────────────────────────────
echo ""
echo "  [holySec] Backend startet auf Port 3001..."
PORT=3001 node backend/server.js &
BACKEND_PID=$!

# ── Vite Dev-Server starten (Frontend + HMR) ─────────────────────────────────
echo "  [holySec] Dev-Server startet auf http://localhost:5173/holySec/"
echo ""

trap "kill $BACKEND_PID 2>/dev/null" EXIT
npm run dev
