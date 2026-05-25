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

# ── Frontend bauen ────────────────────────────────────────────────────────────
echo "  [holySec] Build starten..."
npm run build

if [ $? -ne 0 ]; then
  echo "[ERROR] Build fehlgeschlagen."
  exit 1
fi

# ── Backend-Abhängigkeiten ────────────────────────────────────────────────────
if [ ! -d "backend/node_modules" ]; then
  echo "  [holySec] Backend-Abhängigkeiten installieren..."
  (cd backend && npm install)
fi

# ── Alten Prozess auf Port 5173 beenden (falls bereits läuft) ────────────────
if fuser 5173/tcp &>/dev/null; then
  echo "  [holySec] Port 5173 belegt — beende alten Prozess..."
  fuser -k 5173/tcp &>/dev/null
  sleep 1
fi

# ── Backend starten (serviert Frontend + API) ─────────────────────────────────
echo ""
echo "  [holySec] Server startet..."
echo ""

PORT=5173 node backend/server.js
