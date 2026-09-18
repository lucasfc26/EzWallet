#!/usr/bin/env bash
# Run on the VPS (e.g. /apps/EzWallet) to see what is already bound and pick
# a free host port for EzWallet without touching other apps' routes.
set -euo pipefail

PREFERRED=(27118 27119 27120 18118 18119 18443 19080)
LISTEN_FILE="$(mktemp)"
trap 'rm -f "$LISTEN_FILE"' EXIT

echo "=== TCP ports in use (host) ==="
if command -v ss >/dev/null 2>&1; then
  ss -tulpn 2>/dev/null | awk 'NR==1 || /LISTEN/' | tee "$LISTEN_FILE"
elif command -v netstat >/dev/null 2>&1; then
  netstat -tulpn 2>/dev/null | awk 'NR==1 || /LISTEN/' | tee "$LISTEN_FILE"
else
  echo "ss/netstat not found" >&2
  exit 1
fi

echo
echo "=== Docker published ports ==="
if command -v docker >/dev/null 2>&1; then
  docker ps -a --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null || true
else
  echo "docker not installed"
fi

echo
echo "=== HTTP reverse-proxy vhosts (routes, not just ports) ==="
for dir in /etc/nginx/sites-enabled /etc/nginx/conf.d /etc/caddy /opt/caddy; do
  if [ -d "$dir" ]; then
    echo "-- $dir --"
    grep -RInE --exclude='*.bak' 'listen[[:space:]]|server_name[[:space:]]|location[[:space:]]' "$dir" 2>/dev/null | head -120 || true
  fi
done
if command -v caddy >/dev/null 2>&1 && [ -f /etc/caddy/Caddyfile ]; then
  echo "-- /etc/caddy/Caddyfile --"
  grep -nE '^[a-zA-Z0-9._:-]+|^[[:space:]]*(handle|reverse_proxy|redir)' /etc/caddy/Caddyfile | head -80 || true
fi

port_taken() {
  local p="$1"
  grep -E ":${p}\\b" "$LISTEN_FILE" >/dev/null 2>&1
}

echo
echo "=== EzWallet suggestion ==="
CHOSEN=""
for p in "${PREFERRED[@]}"; do
  if port_taken "$p"; then
    echo "  $p  BUSY"
  else
    echo "  $p  free"
    if [ -z "$CHOSEN" ]; then
      CHOSEN="$p"
    fi
  fi
done

if [ -z "$CHOSEN" ]; then
  for p in $(seq 27121 27200); do
    if ! port_taken "$p"; then
      CHOSEN="$p"
      break
    fi
  done
fi

if [ -z "$CHOSEN" ]; then
  echo "No free port found in 27118-27200. Pick one manually from the list above."
  exit 1
fi

echo
echo "Use in /apps/EzWallet/.env:"
echo "  FRONTEND_BIND=127.0.0.1"
echo "  FRONTEND_PORT=$CHOSEN"
echo "  FRONTEND_ORIGIN=https://ezwallet.maselcorp.com.br"
echo "  COOKIE_SECURE=true"
echo
echo "EzWallet binds only 127.0.0.1:\$FRONTEND_PORT — not 80/443/22/53/3000/5432."
echo "Enable vhost: deploy/ezwallet.maselcorp.com.br.conf (unique server_name)."
