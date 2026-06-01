#!/bin/bash
# Deploy to dev.asciiarena.se (port 3003, /var/www/asciiarena.se/nextjs-dev/)
# This is the DEFAULT deploy target for day-to-day work.
# Production deploys go through ./deploy.sh and require an explicit confirmation.

set -e

# Resilient rsync wrapper (matches deploy.sh):
#   --partial + --partial-dir keep in-flight files across disconnects so
#                              the next attempt resumes instead of restarting
#   --compress                 fewer bytes on the wire
#   retry loop                 up to 5 attempts
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
npm run build

echo "Deploying PHP site (dev mirror)..."
rsync_resilient --include='*.php' --include='.htaccess' --exclude='*' \
  . \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-old/

echo "Deploying .next/ to nextjs-dev..."
rsync_resilient --delete --exclude='cache' \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-dev/.next/

echo "Deploying public/ to nextjs-dev..."
rsync_resilient -L \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-dev/public/

echo "Restarting asciiarena-next-dev..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next-dev && sleep 4 && systemctl is-active asciiarena-next-dev"

echo "Done. Live at https://dev.asciiarena.se/"
