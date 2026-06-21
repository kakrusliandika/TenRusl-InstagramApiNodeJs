#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/opt/tenrusl-instagram-api}
REPO_URL=${REPO_URL:-https://github.com/kakrusliandika/TenRusl-InstagramApiNodeJs.git}

sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

sudo mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  sudo git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
sudo git pull --ff-only || true
if [ ! -f .env ]; then
  sudo cp .env.production.example .env
  echo "Edit $APP_DIR/.env before exposing the service publicly."
fi

sudo docker compose up -d --build
sudo docker compose ps
