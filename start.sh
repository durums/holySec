#!/bin/bash
cd "$(dirname "$0")"

PORT=5173

if ! command -v node &>/dev/null; then
  echo "[ERROR] Node.js nicht gefunden. Bitte installieren: https://nodejs.org"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "[holySec] Abhängigkeiten nicht gefunden – führe Installer aus..."
  ./install.sh || exit 1
fi

echo ""
echo "  ██╗  ██╗ ██████╗ ██╗  ██╗   ██╗███████╗███████╗ ██████╗"
echo "  ██║  ██║██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝██╔════╝██╔════╝"
echo "  ███████║██║   ██║██║   ╚████╔╝ ███████╗█████╗  ██║"
echo "  ██╔══██║██║   ██║██║    ╚██╔╝  ╚════██║██╔══╝  ██║"
echo "  ██║  ██║╚██████╔╝███████╗██║   ███████║███████╗╚██████╗"
echo "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚══════╝ ╚═════╝"
echo ""
echo "  [holySec] Build starten..."
echo ""

npm run build

if [ $? -ne 0 ]; then
  echo "[ERROR] Build fehlgeschlagen."
  exit 1
fi

LOCAL_IP=$(ip -4 addr show scope global | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
[ -z "$LOCAL_IP" ] && LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "  ─────────────────────────────────────────────────"
echo "  Lokal:    http://localhost:$PORT"
echo "  Netzwerk: http://$LOCAL_IP:$PORT"
echo "  ─────────────────────────────────────────────────"
echo ""

npx vite preview
