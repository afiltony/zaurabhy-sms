#!/usr/bin/env bash
# Build the app and upload it to Hostinger over FTP/SFTP.
#
# Required environment variables (set these in your own shell, never in this file):
#   DEPLOY_PROTOCOL   "ftp" or "sftp"
#   DEPLOY_HOST       e.g. ftp.zaurabhya.com or an IP
#   DEPLOY_PORT       21 for ftp, 22 for sftp
#   DEPLOY_USER       Hostinger FTP/SFTP username
#   DEPLOY_PASSWORD   Hostinger FTP/SFTP password
#   DEPLOY_REMOTE_DIR remote path to the Node.js app root in hPanel
#                      (e.g. domains/zaurabhya.com/public_html or the app folder
#                      shown on the hPanel > Node.js app page)
set -euo pipefail

: "${DEPLOY_PROTOCOL:?set DEPLOY_PROTOCOL to ftp or sftp}"
: "${DEPLOY_HOST:?set DEPLOY_HOST}"
: "${DEPLOY_PORT:?set DEPLOY_PORT}"
: "${DEPLOY_USER:?set DEPLOY_USER}"
: "${DEPLOY_PASSWORD:?set DEPLOY_PASSWORD}"
: "${DEPLOY_REMOTE_DIR:?set DEPLOY_REMOTE_DIR}"

cd "$(dirname "$0")/.."

echo "==> Building production bundle"
npm run build

# Files/dirs needed for `next start` to run. node_modules is intentionally
# excluded -- run "NPM Install" from the hPanel Node.js app page after upload.
UPLOAD_PATHS=(package.json package-lock.json next.config.ts public .next)

upload_file() {
  local local_path="$1"
  local remote_path="$DEPLOY_REMOTE_DIR/$local_path"
  curl -sS --ftp-create-dirs \
    -u "$DEPLOY_USER:$DEPLOY_PASSWORD" \
    "$DEPLOY_PROTOCOL://$DEPLOY_HOST:$DEPLOY_PORT/$remote_path" \
    -T "$local_path"
}

echo "==> Uploading to $DEPLOY_PROTOCOL://$DEPLOY_HOST:$DEPLOY_PORT/$DEPLOY_REMOTE_DIR"
for path in "${UPLOAD_PATHS[@]}"; do
  if [ -d "$path" ]; then
    while IFS= read -r file; do
      # Skip the webpack build cache -- large and not needed to run the app.
      [[ "$file" == .next/cache/* ]] && continue
      echo "  $file"
      upload_file "$file"
    done < <(find "$path" -type f)
  else
    echo "  $path"
    upload_file "$path"
  fi
done

echo "==> Done. In hPanel: run NPM Install (if package.json changed) and restart the Node.js app."
