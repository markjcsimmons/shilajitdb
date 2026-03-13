#!/usr/bin/env bash
# Run prisma db push without prisma.config.ts so Prisma loads .env from the project root.
# Use this when "Prisma config detected, skipping environment variable loading" causes auth failures.
set -e
cd "$(dirname "$0")/.."
CONFIG=prisma.config.ts
BAK=prisma.config.ts.bak
if [ -f "$CONFIG" ]; then
  mv "$CONFIG" "$BAK"
fi
npx prisma db push
if [ -f "$BAK" ]; then
  mv "$BAK" "$CONFIG"
fi
