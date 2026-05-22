#!/bin/bash
cd "$(dirname "$0")"

PORT=5173

if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[holySec] Abhängigkeiten installieren..."
  npm install
fi

echo ""
echo "  ██╗  ██╗ ██████╗ ██╗  ██╗   ██╗███████╗███████╗ ██████╗"
echo "  ██║  ██║██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝██╔════╝██╔════╝"
echo "  ███████║██║   ██║██║   ╚████╔╝ ███████╗█████╗  ██║"
echo "  ██╔══██║██║   ██║██║    ╚██╔╝  ╚════██║██╔══╝  ██║"
echo "  ██║  ██║╚██████╔╝███████╗██║   ███████║███████╗╚██████╗"
echo "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚══════╝ ╚═════╝"
echo ""
echo "  Pentest Operations Platform"
echo "  ─────────────────────────────────────────────────"
echo "  URL:     http://localhost:$PORT"
echo "  ─────────────────────────────────────────────────"
echo ""

npx vite --port $PORT --host
