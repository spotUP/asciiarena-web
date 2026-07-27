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

# The server half of the build (server chunks, manifests, BUILD_ID) must match
# the running process exactly, so it syncs with --delete. `static` is EXCLUDED
# here and synced separately below; rsync does not delete excluded paths, so
# the previous build's client chunks survive this step.
echo "Deploying .next/ (server side)..."
rsync_resilient --delete --exclude='cache' --exclude='static' \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/

# Client chunks are ADDITIVE — never --delete here.
#
# Every build mints new content-hashed chunk filenames. A browser that loaded a
# page before the deploy still holds the OLD names, and code-split chunks
# (next/dynamic, route segments) are fetched lazily — often minutes after the
# page loaded, when the user finally clicks something. Deleting the previous
# build's chunks is what produced "Failed to load chunk ... from module" on
# every single deploy. Keeping both builds' chunks costs about 2 MB per deploy
# and makes an open tab survive a deploy instead of breaking.
echo "Deploying .next/static/ (client chunks, additive)..."
rsync_resilient \
  .next/static/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/static/

# Verify every client asset actually landed, and re-sync once if not.
#
# A deploy was observed reporting success while six of the current build's
# chunks never reached the server; re-running the identical rsync transferred
# them. A chunk that is missing rather than stale is the same user-visible
# failure ("Failed to load chunk"), and it is invisible until someone clicks
# the thing that lazy-loads it. Trusting a single rsync is not good enough for
# files the browser hard-depends on, so the deploy now checks its own work.
echo "Verifying client assets..."
verify_static() {
  local missing
  missing=$( (cd .next/static && find . -type f | sort) > /tmp/aa-static-local.txt
    ssh spot@97.75.89.139 'cd /var/www/asciiarena.se/nextjs-current/.next/static && find . -type f | sort' > /tmp/aa-static-remote.txt
    comm -23 /tmp/aa-static-local.txt /tmp/aa-static-remote.txt | wc -l | tr -d ' ' )
  echo "$missing"
}
MISSING=$(verify_static)
if [ "$MISSING" != "0" ]; then
  echo "  $MISSING client asset(s) missing on the server — re-syncing..."
  rsync_resilient .next/static/ spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/static/
  MISSING=$(verify_static)
  if [ "$MISSING" != "0" ]; then
    echo "  [ERROR] $MISSING client asset(s) STILL missing after re-sync. Aborting before restart —"
    echo "          serving this build would give visitors 'Failed to load chunk' errors."
    comm -23 /tmp/aa-static-local.txt /tmp/aa-static-remote.txt | head -10
    exit 1
  fi
fi
echo "  all client assets present."

# Prune chunks no build has produced in the last 14 days. Safe because deploy.sh
# always builds from a clean .next, so every file in the CURRENT build gets a
# fresh mtime that rsync -a carries to the server — an old mtime therefore means
# "no recent build referenced this", not "unchanged since an old build".
echo "Pruning client chunks older than 14 days..."
ssh spot@97.75.89.139 "
  find /var/www/asciiarena.se/nextjs-current/.next/static -type f -mtime +14 -delete 2>/dev/null
  find /var/www/asciiarena.se/nextjs-current/.next/static -type d -empty -delete 2>/dev/null
  echo \"  static now \$(du -sh /var/www/asciiarena.se/nextjs-current/.next/static | cut -f1)\"
"

echo "Deploying public/..."
rsync_resilient -L \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/public/

# nginx serves /assets/ and /fonts/ from the project root (see the nginx conf),
# NOT from public/, so they must be synced too — otherwise CSS/font edits never
# go live.
echo "Deploying assets/ + fonts/..."
rsync_resilient assets/ spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/assets/
rsync_resilient fonts/ spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/fonts/

echo "Syncing nginx config..."
# Guard: if nginx config on server differs from repo, update + reload.
# This prevents the old PHP config from silently reverting (it happened).
ssh spot@97.75.89.139 "sudo cp /etc/nginx/sites-available/asciiarena.se /etc/nginx/sites-available/asciiarena.se.pre-deploy-backup 2>/dev/null || true"
rsync_resilient \
  deploy/asciiarena.se-nginx.conf \
  spot@97.75.89.139:/tmp/asciiarena.se-nginx.conf
ssh spot@97.75.89.139 "
  if ! diff -q /tmp/asciiarena.se-nginx.conf /etc/nginx/sites-available/asciiarena.se > /dev/null 2>&1; then
    echo '  nginx config changed, updating and reloading...'
    sudo cp /tmp/asciiarena.se-nginx.conf /etc/nginx/sites-available/asciiarena.se
    sudo nginx -t && sudo systemctl reload nginx
    echo '  nginx reloaded.'
  else
    echo '  nginx config unchanged.'
  fi
"

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
