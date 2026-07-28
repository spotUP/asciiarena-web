#!/usr/bin/env bash
#
# Delete abandoned registrations, once a day, from the host's crontab.
#
# The rule and its guards live in app/api/admin/purge-inactive/route.ts -- this
# only calls it. Notably it never reaches back before ACTIVATION_FLOW_EPOCH:
# registration stamped accounts "Inactive" for two months before any activation
# mail was sent, and several of those were real people.
#
# Install on the server (as the user that owns the app):
#
#   crontab -e
#   17 4 * * * /var/www/asciiarena.se/nextjs-current/deploy/purge_inactive_cron.sh >> $HOME/asciiarena-purge.log 2>&1
#
# $HOME, not /var/log: the app user cannot create a file there, and cron would
# fail on the redirect before the script ever ran.
#
# Run it with DRY=1 to see what WOULD go (a GET), which changes nothing.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/asciiarena.se/nextjs-current}"
BASE_URL="${BASE_URL:-https://asciiarena.se}"

# The secret is read out of the app's own .env so cron needs no second copy of
# it and rotating it in one place is enough.
if [ ! -r "$APP_DIR/.env" ]; then
  echo "[ERROR] cannot read $APP_DIR/.env"
  exit 1
fi
TOKEN="$(grep -m1 '^REINDEX_SECRET=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '"'"'"' \r')"
if [ -z "$TOKEN" ]; then
  echo "[ERROR] REINDEX_SECRET is not set in $APP_DIR/.env"
  exit 1
fi

METHOD=POST
[ "${DRY:-0}" = "1" ] && METHOD=GET

# --fail so a 401/500 is a non-zero exit and cron mails about it, instead of the
# job quietly doing nothing for months.
OUT="$(curl -fsS -X "$METHOD" "$BASE_URL/api/admin/purge-inactive?token=$TOKEN")"
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $METHOD purge-inactive: $OUT"
