#!/bin/bash
# PRODUCTION deploy to asciiarena.se (port 3001, /var/www/asciiarena.se/nextjs-current/)
# Requires explicit confirmation. For day-to-day work use ./deploy-dev.sh instead.

set -e

# Guard: refuse to run without explicit prod confirmation
if [ "$1" != "--prod" ]; then
  cat <<'EOF'
ERROR: This script deploys to PRODUCTION (asciiarena.se).
For dev work, use ./deploy-dev.sh instead.

To deploy to prod, run:
  ./deploy.sh --prod

EOF
  exit 1
fi

echo ">>> PRODUCTION DEPLOY to asciiarena.se <<<"
echo "Building..."
npm run build

echo "Deploying PHP site..."
rsync -a --no-owner --no-group --include='*.php' --include='.htaccess' --exclude='*' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  . \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-old/

echo "Deploying .next/ to nextjs-current..."
rsync -a --no-owner --no-group --delete --exclude='cache' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/

echo "Deploying public/ to nextjs-current..."
rsync -aL --no-owner --no-group \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/public/

echo "Restarting asciiarena-next..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next && sleep 4 && systemctl is-active asciiarena-next"

echo "Done. Live at https://asciiarena.se/"
