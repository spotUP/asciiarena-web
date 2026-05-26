#!/bin/bash
# Deploy to dev.asciiarena.se (port 3003, /var/www/asciiarena.se/nextjs-dev/)
# This is the DEFAULT deploy target for day-to-day work.
# Production deploys go through ./deploy.sh and require an explicit confirmation.

set -e

echo "Building..."
npm run build

echo "Deploying PHP site (dev mirror)..."
rsync -a --no-owner --no-group --include='*.php' --include='.htaccess' --exclude='*' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  . \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-old/

echo "Deploying .next/ to nextjs-dev..."
rsync -a --no-owner --no-group --delete --exclude='cache' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-dev/.next/

echo "Deploying public/ to nextjs-dev..."
rsync -aL --no-owner --no-group \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-dev/public/

echo "Restarting asciiarena-next-dev..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next-dev && sleep 4 && systemctl is-active asciiarena-next-dev"

echo "Done. Live at https://dev.asciiarena.se/"
