#!/bin/bash

set -e

echo "Generating Prisma client..."
pnpm prisma:generate

echo "Running Prisma migrations..."
pnpm prisma:migrate:deploy

echo "Starting application..."
exec "$@" 