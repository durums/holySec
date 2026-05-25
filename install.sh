#!/usr/bin/env bash
#
# holySec - Automatisierter Installer
# Installiert Node.js (falls nötig) und alle Projekt-Abhängigkeiten.
#
set -e

cd "$(dirname "$0")"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[holySec]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[FAIL]${NC} $*" >&2; }

banner() {
  echo ""
  echo "  ██╗  ██╗ ██████╗ ██╗  ██╗   ██╗███████╗███████╗ ██████╗"
  echo "  ██║  ██║██╔═══██╗██║  ╚██╗ ██╔╝██╔════╝██╔════╝██╔════╝"
  echo "  ███████║██║   ██║██║   ╚████╔╝ ███████╗█████╗  ██║"
  echo "  ██╔══██║██║   ██║██║    ╚██╔╝  ╚════██║██╔══╝  ██║"
  echo "  ██║  ██║╚██████╔╝███████╗██║   ███████║███████╗╚██████╗"
  echo "  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝   ╚══════╝╚══════╝ ╚═════╝"
  echo ""
  echo "                Automatischer Installer"
  echo ""
}

NODE_MIN_MAJOR=18
SUDO=""

need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
      SUDO="sudo"
    else
      err "Root-Rechte oder sudo werden zur Installation von Node.js benötigt."
      err "Bitte Node.js >= ${NODE_MIN_MAJOR} manuell installieren: https://nodejs.org"
      exit 1
    fi
  fi
}

detect_pkg_manager() {
  if command -v apt-get >/dev/null 2>&1; then echo "apt"; return; fi
  if command -v dnf >/dev/null 2>&1; then echo "dnf"; return; fi
  if command -v yum >/dev/null 2>&1; then echo "yum"; return; fi
  if command -v pacman >/dev/null 2>&1; then echo "pacman"; return; fi
  if command -v zypper >/dev/null 2>&1; then echo "zypper"; return; fi
  if command -v brew >/dev/null 2>&1; then echo "brew"; return; fi
  echo "none"
}

install_node() {
  log "Installiere Node.js LTS..."
  local pm
  pm=$(detect_pkg_manager)

  case "$pm" in
    apt)
      need_sudo
      $SUDO apt-get update -y
      $SUDO apt-get install -y curl ca-certificates
      curl -fsSL https://deb.nodesource.com/setup_lts.x | $SUDO -E bash -
      $SUDO apt-get install -y nodejs
      ;;
    dnf|yum)
      need_sudo
      curl -fsSL https://rpm.nodesource.com/setup_lts.x | $SUDO bash -
      $SUDO "$pm" install -y nodejs
      ;;
    pacman)
      need_sudo
      $SUDO pacman -Sy --noconfirm nodejs npm
      ;;
    zypper)
      need_sudo
      $SUDO zypper install -y nodejs npm
      ;;
    brew)
      brew install node
      ;;
    *)
      err "Kein unterstützter Paketmanager gefunden."
      err "Bitte Node.js >= ${NODE_MIN_MAJOR} manuell installieren: https://nodejs.org"
      exit 1
      ;;
  esac
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    warn "Node.js nicht gefunden."
    install_node
  fi

  local major
  major=$(node -p "process.versions.node.split('.')[0]")
  if [ "$major" -lt "$NODE_MIN_MAJOR" ]; then
    warn "Node.js v$(node -v) ist zu alt (benötigt: >= ${NODE_MIN_MAJOR})."
    install_node
  fi

  ok "Node.js $(node -v)"
  ok "npm $(npm -v)"
}

install_deps() {
  log "Installiere Projekt-Abhängigkeiten..."

  # legacy-peer-deps wird über .npmrc geregelt (react-leaflet@5 vs react@18)
  if [ -f "package-lock.json" ]; then
    if ! npm ci; then
      warn "npm ci fehlgeschlagen, fallback auf npm install..."
      rm -rf node_modules
      npm install
    fi
  else
    npm install
  fi

  ok "Abhängigkeiten installiert ($(ls node_modules | wc -l) Pakete)"
}

verify_build() {
  log "Verifiziere Build..."
  if npm run build; then
    ok "Build erfolgreich"
  else
    err "Build fehlgeschlagen. Bitte Logs prüfen."
    exit 1
  fi
}

main() {
  banner
  check_node
  install_deps
  verify_build

  echo ""
  ok "Installation abgeschlossen!"
  echo ""
  echo "  Starten mit:   ./start.sh"
  echo "  Dev-Server:    npm run dev"
  echo ""
}

main "$@"
