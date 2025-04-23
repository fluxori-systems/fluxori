#!/usr/bin/env bash
set -euo pipefail

echo "[Smoke Test] Building and starting services..."
docker-compose up -d --build mongodb backend frontend

echo "[Smoke Test] Waiting for services to be healthy..."
for i in {1..30}; do
  if curl --silent --fail http://localhost:3001/health && curl --silent --fail http://localhost:3000; then
    echo "[Smoke Test] Services healthy"
    break
  else
    echo "[Smoke Test] Waiting... ($i/30)"
    sleep 2
  fi
done

echo "[Smoke Test] Tearing down services..."
docker-compose down