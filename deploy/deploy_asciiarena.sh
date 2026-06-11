#!/usr/bin/env bash
# Server-side deploy script — lives at ~/bin/deploy_asciiarena.sh on the server.
# Called by GitHub Actions AFTER the built artifact has already been rsynced.
# The server never runs npm ci or npm run build — that happens on the CI runner.
set -euo pipefail

REPO=/var/www/asciiarena.se/nextjs-current
SERVICE=asciiarena-next
NGINX_INCOMING=/tmp/asciiarena-nginx.conf
NGINX_LIVE=/etc/nginx/sites-available/asciiarena.se

echo "[deploy] syncing nginx config..."
if [ -f "$NGINX_INCOMING" ] && ! diff -q "$NGINX_INCOMING" "$NGINX_LIVE" > /dev/null 2>&1; then
  sudo cp "$NGINX_INCOMING" "$NGINX_LIVE"
  sudo nginx -t && sudo systemctl reload nginx
  echo "[deploy] nginx config updated and reloaded"
else
  echo "[deploy] nginx config unchanged"
fi

echo "[deploy] restarting service..."
sudo systemctl restart "$SERVICE"
sleep 4

if sudo systemctl is-active --quiet "$SERVICE"; then
  echo "[deploy] OK: $SERVICE is running"
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3001/ || echo 000)
    [ "$code" = "200" ] && echo "[deploy] warm after ${i}s" && exit 0
    sleep 1
  done
  echo "[deploy] WARNING: service up but not responding 200 after 20s"
else
  echo "[deploy] FAILED"
  sudo journalctl -u "$SERVICE" -n 30 --no-pager
  exit 1
fi
