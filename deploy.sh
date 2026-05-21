#!/bin/bash
set -e

echo "Building..."
npm run build

echo "Deploying .next/..."
rsync -a --delete --exclude='cache' \
  .next/ \
  spot@97.75.89.139:/var/www/asciiarena.se/nextjs-current/.next/

echo "Restarting service..."
ssh spot@97.75.89.139 "sudo systemctl restart asciiarena-next && sleep 4 && systemctl is-active asciiarena-next"

echo "Done."
