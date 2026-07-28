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
# LC_ALL=C on BOTH sides is load-bearing, not decoration. macOS ships BSD sort
# and the server GNU sort, and their default locales order punctuation
# differently. `comm` assumes both inputs use the SAME collation, so without
# this it reports chunks as missing that are sitting right there — and Turbopack
# names chunks with exactly the punctuation the two disagree about (~ _ - .).
verify_static() {
  # LC_ALL=C applies to `comm` as well, not just the two sorts. BSD comm
  # compares using the current locale, so pinning only the sorts still let it
  # report present files as missing -- which aborted a good deploy.
  ( cd .next/static && find . -type f | LC_ALL=C sort ) > /tmp/aa-static-local.txt
  ssh spot@97.75.89.139 'cd /var/www/asciiarena.se/nextjs-current/.next/static && find . -type f | LC_ALL=C sort' > /tmp/aa-static-remote.txt
  LC_ALL=C comm -23 /tmp/aa-static-local.txt /tmp/aa-static-remote.txt | wc -l | tr -d ' '
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

# Regression guard for "Failed to load chunk" (2026-07-28).
#
# `verify_static` above proves the chunks are ON DISK. That is not the same as
# SERVABLE, and the difference is what broke visitors: Next standalone resolves
# /_next/static against a file set computed at process startup, so every chunk
# rsynced after the last restart 404'd until the next one -- while the same
# process was already rendering HTML that referenced those chunks.
#
# This runs at the exact moment that used to fail: new files synced, service
# NOT yet restarted. It writes a probe into the static dir and fetches it over
# https. Served from nginx (see deploy/asciiarena.se-nginx.conf) it is 200.
# Proxied to the not-yet-restarted Next process it is 404 -- which is precisely
# the visitor-facing bug, caught before the deploy reports success.
echo "Verifying new chunks are servable before restart..."
PROBE="deploy-probe-$$.js"
ssh spot@97.75.89.139 "echo 'export const probe=1' > /var/www/asciiarena.se/nextjs-current/.next/static/chunks/$PROBE"
probe_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://asciiarena.se/_next/static/chunks/$PROBE" || echo 000)
ssh spot@97.75.89.139 "rm -f /var/www/asciiarena.se/nextjs-current/.next/static/chunks/$PROBE"
STATIC_SERVABLE=1
if [ "$probe_code" != "200" ]; then
  STATIC_SERVABLE=0
  echo "  [ERROR] a freshly synced chunk returned $probe_code, not 200."
  echo "          Visitors loading the site between the rsync and the restart get"
  echo "          'Failed to load chunk' and a dead page until they hard-reload."
  echo "          Check that location /_next/static/ exists in the nginx config."
  echo "          Continuing to the restart anyway — restarting REPAIRS this state,"
  echo "          aborting here would leave it broken for longer."
else
  echo "  new chunks servable pre-restart (probe 200)."
fi

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

if [ "$STATIC_SERVABLE" -ne 1 ]; then
  echo "Done, but FAILING the deploy: client chunks were not servable before the"
  echo "restart, so anyone who loaded the site during this deploy hit a chunk error."
  exit 1
fi

echo "Done."
