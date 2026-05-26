#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Deploying PHP site..."
rsync -a --no-owner --no-group --include='*.php' --include='.htaccess' --exclude='*' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  . \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-old/

echo "Deploying .next/..."
rsync -a --no-owner --no-group --delete --exclude='cache' \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/

echo "Deploying public/..."
rsync -aL --no-owner --no-group \
  -e "ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=6" \
  public/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/public/

echo "Restarting service..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next && sleep 4 && systemctl is-active asciiarena-next"

echo "Done."
