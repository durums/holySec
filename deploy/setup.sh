#!/bin/bash
# Einmalig auf dem VPS als root ausführen: bash setup.sh
set -e

echo "[1/7] System aktualisieren..."
apt update && apt upgrade -y

echo "[2/7] Node.js 20 + Nginx + Certbot installieren..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx

echo "[3/7] Systembenutzer anlegen..."
useradd -r -s /bin/false holysec || echo "  Nutzer existiert bereits."

echo "[4/7] App-Verzeichnis vorbereiten..."
mkdir -p /opt/holysec
cp -r . /opt/holysec
chown -R holysec:holysec /opt/holysec

echo "[5/7] Abhängigkeiten installieren + Frontend bauen..."
cd /opt/holysec
npm install
npm run build
cd backend && npm install && cd ..

echo "[6/7] .env einrichten..."
if [ ! -f /opt/holysec/backend/.env ]; then
  cp /opt/holysec/backend/.env.example /opt/holysec/backend/.env
  echo ""
  echo "  WICHTIG: /opt/holysec/backend/.env öffnen und Passwörter eintragen!"
  echo "  nano /opt/holysec/backend/.env"
  echo ""
fi

echo "[7/7] systemd-Service + Nginx einrichten..."
cp /opt/holysec/deploy/holysec.service /etc/systemd/system/holysec.service
systemctl daemon-reload
systemctl enable holysec
systemctl start holysec

cp /opt/holysec/deploy/nginx.conf /etc/nginx/sites-available/ops.holysec.de
ln -sf /etc/nginx/sites-available/ops.holysec.de /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Fertig! Jetzt SSL einrichten:"
echo "  certbot --nginx -d ops.holysec.de"
echo "═══════════════════════════════════════════════════"
