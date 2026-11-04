#!/usr/bin/env bash
# Starts the API (:4000), website (:3002), admin panel (:3003) and Expo
# (:8081) — everything the app needs, plus the admin's Integrations. Detached, so they keep running after this terminal closes.
# Logs go to ~/.local/state/pratikar-dev/. Stop them with: scripts/dev-mobile.sh stop
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOGS="${XDG_STATE_HOME:-$HOME/.local/state}/pratikar-dev"
mkdir -p "$LOGS"

# The nvm node the repo is built with, when there is one.
NVM_BIN="$(ls -d "$HOME"/.nvm/versions/node/v24*/bin 2>/dev/null | tail -1)"
[ -n "$NVM_BIN" ] && PATH="$NVM_BIN:$PATH"
PATH="$HOME/.local/bin:$PATH"

port_up() { ss -ltn | grep -q ":$1 "; }
stop_port() {
  local pids
  pids="$(ss -ltnp | grep ":$1 " | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u)"
  [ -n "$pids" ] && kill $pids 2>/dev/null
}

if [ "${1:-}" = "stop" ]; then
  for port in 8081 3003 3002 4000; do stop_port "$port"; done
  echo "Stopped."
  exit 0
fi

LAN_IP="$(ip -4 route get 1.1.1.1 2>/dev/null | grep -oE 'src [0-9.]+' | cut -d' ' -f2)"
LAN_IP="${LAN_IP:-127.0.0.1}"

start() { # name port dir command...
  local name="$1" port="$2" dir="$3"
  shift 3
  if port_up "$port"; then
    echo "$name already running on :$port"
    return
  fi
  (cd "$dir" && setsid nohup "$@" >"$LOGS/$name.log" 2>&1 < /dev/null &)
  echo "$name starting on :$port (log: $LOGS/$name.log)"
}

docker compose -f "$ROOT/docker-compose.yml" up -d postgres redis >/dev/null 2>&1 || true

# The API restarts when the address changes, so its allowed origins follow.
if port_up 4000 && [ "$(cat "$LOGS/lan-ip" 2>/dev/null)" != "$LAN_IP" ]; then
  stop_port 4000
  sleep 1
fi
echo "$LAN_IP" >"$LOGS/lan-ip"

[ -f "$ROOT/apps/api/dist/main.js" ] || (cd "$ROOT/apps/api" && echo "Building the API first…" && ./node_modules/.bin/nest build)

ORIGINS="http://localhost:3000,http://localhost:3002,http://localhost:3003,http://localhost:8081,http://$LAN_IP:8081"
start api 4000 "$ROOT/apps/api" env ALLOWED_ORIGINS="$ORIGINS" PUBLIC_SITE_URL=http://localhost:3002 PORT=4000 node --enable-source-maps dist/main
start web 3002 "$ROOT/apps/web" ./node_modules/.bin/next dev -p 3002
start admin 3003 "$ROOT/apps/admin" ./node_modules/.bin/next dev -p 3003
start expo 8081 "$ROOT/apps/mobile" env EXPO_NO_TELEMETRY=1 REACT_NATIVE_PACKAGER_HOSTNAME="$LAN_IP" ./node_modules/.bin/expo start --lan --port 8081

cat <<MSG

Give it a few minutes on this disk, then:
  Admin:     http://localhost:3003/integrations
  Browser:   http://localhost:8081
  Expo Go:   enter URL  exp://$LAN_IP:8081   (phone on the same Wi-Fi)
MSG
