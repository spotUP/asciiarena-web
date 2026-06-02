#!/bin/bash
set -e

# Wrapper that makes rsync resilient to flaky SSH:
#   --partial + --partial-dir keeps in-flight files across disconnects,
#                              next attempt resumes instead of restarting
#   --compress                 fewer bytes on the wire, faster + less time
#                              exposed to a drop
#   retry loop                 disconnects auto-resume up to 5 times
RSYNC_SSH="ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=12 -o ConnectTimeout=15"
rsync_resilient() {
  local attempt=0
  until [ $attempt -ge 5 ]; do
    attempt=$((attempt + 1))
    if rsync -a --partial --partial-dir=.rsync-partial --compress \
            --no-owner --no-group "$@" -e "$RSYNC_SSH"; then
      return 0
    fi
    echo "  rsync attempt $attempt failed, retrying in 5s..."
    sleep 5
  done
  echo "  rsync gave up after 5 attempts"
  return 1
}

echo "Building..."
# Always build from a clean .next. Incremental builds + the resilient
# (retrying) rsync below could leave a single route's server chunk stale or
# missing, which 500s only that route while everything else works (hit twice:
# home page and /admin/migrate-country). A clean tree also avoids the stale
# .next/dev types dir tripping rsync --delete.
rm -rf .next
npm run build

echo "Deploying PHP site..."
rsync_resilient --include='*.php' --include='.htaccess' --exclude='*' \
  . \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-old/

echo "Deploying .next/..."
rsync_resilient --delete --exclude='cache' \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/

echo "Deploying public/..."
rsync_resilient -L \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/public/

echo "Restarting service..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next && sleep 4 && systemctl is-active asciiarena-next"

# Warm-up: after a restart the new Next process is up but its Prisma/MariaDB
# pool hasn't connected yet, so the first requests in that window return a bare
# 500. Poll the home page until it serves 200 so the deploy absorbs the
# cold-start window instead of leaving it exposed to real visitors.
echo "Warming up (waiting for home page to serve 200)..."
warm=0
for attempt in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://asciiarena.se/ || echo 000)
  if [ "$code" = "200" ]; then
    echo "  home page 200 after ${attempt}s — pool warm."
    warm=1
    break
  fi
  sleep 1
done
if [ "$warm" -ne 1 ]; then
  echo "  WARNING: home page still not 200 after 30s (last code: ${code}). Check the service."
fi

echo "Done."
