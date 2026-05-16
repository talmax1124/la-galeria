#!/bin/sh
set -e

if [ -z "$WORKER_URL" ]; then
  echo "ERROR: WORKER_URL environment variable is not set."
  echo "Set it to your deployed Cloudflare Worker URL, e.g.:"
  echo "  WORKER_URL=https://la-galeria-api.<account>.workers.dev"
  exit 1
fi

# Substitute only $WORKER_URL — nginx variables like $uri, $http_host are left intact.
envsubst '$WORKER_URL' \
  < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
