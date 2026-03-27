#!/bin/bash

set -euo pipefail

./run.sh &
RUN_PID=$!

sleep 5

if curl -s http://127.0.0.1:8000/api/health/ | grep -q "healthy"; then
  echo "✓ Backend health check passed"
else
  echo "✗ Backend health check failed"
  kill $RUN_PID
  exit 1
fi

if curl -s http://localhost:3000 | grep -q "nexus AI"; then
  echo "✓ Frontend loaded successfully"
else
  echo "✗ Frontend failed to load"
  kill $RUN_PID
  exit 1
fi

kill $RUN_PID
wait $RUN_PID 2>/dev/null || true

echo "✓ All startup tests passed"
