#!/bin/bash
# Deploy the Next.js app to the production server.
# Run from the project root on your local machine.
# Usage: ./deploy.sh

set -euo pipefail

SERVER="spot@97.75.89.139"
DEPLOY_DIR="/var/www/asciiarena.se"
BRANCH="modernize/typescript-nextjs"

echo "[1/5] Building production bundle..."
npm run build

echo "[2/5] Syncing standalone bundle to server..."
rsync -az --delete \
  .next/standalone/ \
  "${SERVER}:${DEPLOY_DIR}/.next-new/"

rsync -az --delete \
  .next/static/ \
  "${SERVER}:${DEPLOY_DIR}/.next-new/.next/static/"

rsync -az --delete \
  public/ \
  "${SERVER}:${DEPLOY_DIR}/.next-new/public/"

echo "[3/5] Copying .env if not present on server..."
ssh "${SERVER}" "test -f ${DEPLOY_DIR}/.env || echo 'WARNING: ${DEPLOY_DIR}/.env not found — create it from .env.example before starting'"

echo "[4/5] Atomic swap and restart..."
ssh "${SERVER}" "
  set -e
  # Stop the current process if running
  pkill -f 'node.*server.js' 2>/dev/null || true
  sleep 1

  # Swap directories
  rm -rf ${DEPLOY_DIR}/.next-old 2>/dev/null || true
  mv ${DEPLOY_DIR}/current ${DEPLOY_DIR}/.next-old 2>/dev/null || true
  mv ${DEPLOY_DIR}/.next-new ${DEPLOY_DIR}/current

  # Copy .env into bundle dir
  cp ${DEPLOY_DIR}/.env ${DEPLOY_DIR}/current/.env

  # Start
  cd ${DEPLOY_DIR}/current
  NODE_ENV=production PORT=3000 nohup node server.js >> ${DEPLOY_DIR}/app.log 2>&1 &
  echo 'Started PID '\$!
"

echo "[5/5] Health check..."
sleep 3
ssh "${SERVER}" "curl -sf http://localhost:3000/ -o /dev/null && echo 'OK' || echo 'FAIL — check ${DEPLOY_DIR}/app.log'"

echo "Deploy complete."
