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

# Regression guard for "Failed to load chunk" (2026-07-28).
#
# Next standalone resolves /_next/static against a file set computed at process
# STARTUP. Chunks are rsynced before this script runs and the service is only
# restarted below, so for that whole gap the live process was rendering HTML
# that referenced the new chunk names while 404-ing the files themselves:
#
#   11:34:13  rsync writes .next/static/chunks/04_f88pua7nms.js
#   11:35:22  GET /_next/static/chunks/04_f88pua7nms.js -> 404
#   11:35:23  systemctl restart asciiarena-next
#
# Visitors in that window got a dead page until they hard-reloaded. nginx now
# serves /_next/static/ straight from disk, which removes the window entirely.
#
# This checks SERVABLE, not merely present-on-disk — the files were always on
# disk while browsers 404'd, which is why the CI-side file-list verification
# never caught it. It runs at the exact moment that used to fail: chunks synced,
# service not yet restarted.
echo "[deploy] verifying new chunks are servable before restart..."
PROBE="deploy-probe-$$.js"
echo 'export const probe=1' > "$REPO/.next/static/chunks/$PROBE"
PROBE_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 \
  "https://asciiarena.se/_next/static/chunks/$PROBE" || echo 000)
rm -f "$REPO/.next/static/chunks/$PROBE"
STATIC_SERVABLE=1
if [ "$PROBE_CODE" != "200" ]; then
  STATIC_SERVABLE=0
  echo "[deploy] ERROR: a freshly synced chunk returned $PROBE_CODE, not 200."
  echo "[deploy]        Anyone loading the site during this deploy gets"
  echo "[deploy]        'Failed to load chunk' and a dead page until they hard-reload."
  echo "[deploy]        Check that 'location /_next/static/' is in the nginx config."
  echo "[deploy]        Continuing to the restart — restarting REPAIRS this state,"
  echo "[deploy]        aborting here would leave it broken for longer."
else
  echo "[deploy] new chunks servable pre-restart (probe 200)"
fi

echo "[deploy] restarting service..."
sudo systemctl restart "$SERVICE"
sleep 4

if sudo systemctl is-active --quiet "$SERVICE"; then
  echo "[deploy] OK: $SERVICE is running"
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3001/ || echo 000)
    if [ "$code" = "200" ]; then
      echo "[deploy] warm after ${i}s"
      break
    fi
    sleep 1
  done
  if [ "$code" != "200" ]; then
    echo "[deploy] WARNING: service up but not responding 200 after 20s"
  fi
else
  echo "[deploy] FAILED"
  sudo journalctl -u "$SERVICE" -n 30 --no-pager
  exit 1
fi

# Reported only now: the restart above repairs the mixed state, so the deploy
# should finish before it fails. A red build here means real visitors hit chunk
# errors during this deploy.
if [ "$STATIC_SERVABLE" -ne 1 ]; then
  echo "[deploy] FAILING: client chunks were not servable before the restart."
  exit 1
fi
