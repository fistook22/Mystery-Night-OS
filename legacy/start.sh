#!/usr/bin/env bash
# Mystery Night OS — startup script
# Usage: ./start.sh [--port 3000]

set -e

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

PORT=${PORT:-3000}

echo ""
echo "╔══════════════════════════════════════╗"
echo "║       MYSTERY NIGHT OS — v0.1        ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Validate required env
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠  ANTHROPIC_API_KEY not set — AI personalization will use fallback templates"
fi
if [ -z "$WHATSAPP_TOKEN" ]; then
  echo "⚠  WHATSAPP_TOKEN not set — WhatsApp messages will be logged to console only"
fi
if [ -z "$TWILIO_ACCOUNT_SID" ]; then
  echo "⚠  TWILIO_ACCOUNT_SID not set — Voice calls will be logged to console only"
fi

echo ""
echo "  Host dashboard:  http://localhost:${PORT}/host"
echo "  TV main screen:  http://localhost:${PORT}/screen"
echo ""

NODE_PATH=/opt/node22/lib/node_modules \
  /opt/node22/bin/ts-node \
  --project tsconfig.json \
  src/server.ts
