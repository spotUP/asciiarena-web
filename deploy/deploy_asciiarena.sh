#!/usr/bin/env bash
# Server-side deploy script — lives at ~/bin/deploy_asciiarena.sh on the server.
# Triggered automatically by GitHub Actions on every push to the deploy branch.
# Can also be run manually: ssh spot@<server> bash ~/bin/deploy_asciiarena.sh
set -euo pipefail

REPO=/var/www/asciiarena.se/nextjs-current
SERVICE=asciiarena-next
BRANCH=modernize/typescript-nextjs

cd "$REPO"

echo "[deploy] fetching latest code..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "[deploy] syncing nginx config..."
NGINX_CONF="$REPO/deploy/asciiarena.se-nginx.conf"
if ! diff -q "$NGINX_CONF" /etc/nginx/sites-available/asciiarena.se > /dev/null 2>&1; then
  sudo cp "$NGINX_CONF" /etc/nginx/sites-available/asciiarena.se
  sudo nginx -t && sudo systemctl reload nginx
  echo "[deploy] nginx config updated and reloaded"
else
  echo "[deploy] nginx config unchanged"
fi

echo "[deploy] installing dependencies..."
npm ci

echo "[deploy] building..."
npm run build

echo "[deploy] updating server entrypoint..."
cp .next/standalone/server.js server.js

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
