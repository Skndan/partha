#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <domain>"
  exit 1
fi

DOMAIN="$1"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

if [[ ! -f ".env.local" ]]; then
  echo "Missing .env.local"
  exit 1
fi

if [[ -z "${DOMAIN// /}" ]]; then
  echo "Domain is empty"
  exit 1
fi

UPSTREAM_HOST="app"

# Ensure directories exist before we start nginx mounting.
mkdir -p "nginx/conf.d"

# Derive a docker-friendly DATABASE_URL:
# - keep user/password/db part
# - replace localhost/127.0.0.1 host with the docker-compose service name `postgres`
DB_URL_RAW="$(awk -F= '/^DATABASE_URL=/{print $2; exit}' .env.local | sed -E 's/^"//; s/"$//')"
if [[ -z "${DB_URL_RAW}" ]]; then
  echo "Could not find DATABASE_URL in .env.local"
  exit 1
fi

DB_URL_DOCKER="$(echo "$DB_URL_RAW" | sed -E 's/@localhost:5432/@postgres:5432/; s/@127\\.0\\.0\\.1:5432/@postgres:5432/')"

# Fallback if the hostname wasn't replaced.
if [[ "$DB_URL_DOCKER" == "$DB_URL_RAW" ]]; then
  echo "Warning: could not replace DB host in DATABASE_URL; using a default postgres URL."
  DB_URL_DOCKER="postgresql://postgres:postgres@postgres:5432/partha"
fi

CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
if [[ -z "$CERTBOT_EMAIL" ]] && grep -qE '^CERTBOT_EMAIL=' .env.local; then
  CERTBOT_EMAIL="$(awk -F= '/^CERTBOT_EMAIL=/{print $2; exit}' .env.local | sed -E 's/^"//; s/"$//')"
fi

# Create docker-compose runtime env file from .env.local.
# Compose will read `.env` and the `app`/`migrate` services use `env_file: .env`.
TMP_ENV="$(mktemp)"
awk -v domain="$DOMAIN" -v db_url="$DB_URL_DOCKER" '
  BEGIN { https="https://" domain }
  /^NODE_ENV=/ { print "NODE_ENV=production"; next }
  /^DATABASE_URL=/ { print "DATABASE_URL=" db_url; next }
  /^NEXT_PUBLIC_URL=/ { print "NEXT_PUBLIC_URL=" https; next }
  /^BETTER_AUTH_URL=/ { print "BETTER_AUTH_URL=" https; next }
  { print }
' .env.local > "$TMP_ENV"

mv "$TMP_ENV" .env

echo "Wrote .env for domain: $DOMAIN"

#
# 1) Issue TLS cert using Certbot (standalone).
#
CERTBOT_CMD=(
  certonly
  --standalone
  -d "$DOMAIN"
  --agree-tos
  --non-interactive
)

if [[ -n "$CERTBOT_EMAIL" ]]; then
  CERTBOT_CMD+=( --email "$CERTBOT_EMAIL" )
else
  CERTBOT_CMD+=( --register-unsafely-without-email )
fi

echo "Requesting Let's Encrypt certificate for $DOMAIN..."

# `letsencrypt` volume is declared in docker-compose.yml.
docker compose --project-directory . volume inspect letsencrypt >/dev/null 2>&1 || true

docker run --rm -it \
  -p 80:80 \
  -v letsencrypt:/etc/letsencrypt \
  certbot/certbot:latest \
  "${CERTBOT_CMD[@]}"

#
# 2) Render Nginx config from template.
#
sed \
  -e "s#{{DOMAIN}}#${DOMAIN}#g" \
  -e "s#{{UPSTREAM_HOST}}#${UPSTREAM_HOST}#g" \
  nginx/default.conf.template > nginx/conf.d/default.conf

echo "Generated nginx/conf.d/default.conf"

#
# 3) Start stack.
#
echo "Starting postgres..."
docker compose up -d postgres

echo "Running migrations..."
docker compose run --rm migrate

echo "Starting app and nginx..."
docker compose up -d app nginx

echo "Done."
echo "App should now be reachable at: https://${DOMAIN}"

